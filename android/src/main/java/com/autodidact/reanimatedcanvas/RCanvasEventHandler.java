package com.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ViewParent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

public class RCanvasEventHandler {
    public final static String STROKE_START = "onStrokeStart";
    public final static String STROKE_CHANGED = "onStrokeChanged";
    public final static String STROKE_END = "onStrokeEnd";
    public final static String ON_PRESS = "onPress";
    public final static String ON_LONG_PRESS = "onLongPress";
    public final static String PATHS_UPDATE = "pathsUpdate";
    public final static String ON_SKETCH_SAVED = "onSketchSaved";

    private RCanvas mView;
    private TouchState mTouchState;
    private int prevTouchAction = -1;
    private boolean mShouldFireOnStrokeChangedEvent = false;
    private boolean mShouldFireOnPressEvent = false;
    private boolean mShouldFireOnLongPressEvent = false;
    private boolean mShouldHandleTouches = false;

    private GestureDetector detector;
    private EventDispatcher mEventDispatcher;

    public RCanvasEventHandler(RCanvas view){
        mView = view;
        mEventDispatcher = ((ReactContext) view.getContext()).getNativeModule(UIManagerModule.class).getEventDispatcher();
        detector =  new GestureDetector(mView.getContext(), new GestureListener()){
            @Override
            public boolean onTouchEvent(MotionEvent ev) {
                if(ev.getAction() == MotionEvent.ACTION_UP && mView.getCurrentPath() != null) {
                    mView.end();
                }
                return super.onTouchEvent(ev);
            }
        };
    }

    public TouchState getTouchState(){
        return mTouchState;
    }

    public void setTouchState(TouchState touchState){
        mTouchState = touchState;
        ViewParent parent = mView.getParent();
        if(parent != null) {
            if (mTouchState.getState() == TouchState.NONE) {
                parent.requestDisallowInterceptTouchEvent(false);
            } else {
                parent.requestDisallowInterceptTouchEvent(true);
            }
        }
    }

    public void setShouldFireOnStrokeChangedEvent(boolean fire){
        mShouldFireOnStrokeChangedEvent = fire;
    }

    public void setShouldFireOnPressEvent(boolean shouldFireEvent) {
        mShouldFireOnPressEvent = shouldFireEvent;
    }

    public void setShouldFireOnLongPressEvent(boolean shouldFireEvent) {
        mShouldFireOnLongPressEvent = shouldFireEvent;
    }

    public void setShouldHandleTouches(boolean shouldHandleTouches) {
        mShouldHandleTouches = shouldHandleTouches;
    }

    public boolean onTouchEvent(MotionEvent ev){
        return mShouldHandleTouches && mTouchState.enabled() && detector.onTouchEvent(ev);
    }

    private class GestureListener implements GestureDetector.OnGestureListener {
        private boolean isLongPress;
        @Override
        public boolean onDown(MotionEvent event) {
            int action = event.getAction();
            if(mView.getCurrentPath() != null) mView.end();
            prevTouchAction = action;
            isLongPress = false;
            return true;
        }

        @Override
        public void onShowPress(MotionEvent motionEvent) {

        }

        @Override
        public void onLongPress(MotionEvent motionEvent) {
            isLongPress = true;
            if(mShouldFireOnLongPressEvent) emitPress(motionEvent.getX(), motionEvent.getY(), ON_LONG_PRESS);
        }

        @Override
        public boolean onFling(MotionEvent motionEvent, MotionEvent motionEvent1, float v, float v1) {
            return false;
        }

        @Override
        public boolean onScroll(MotionEvent downEvent, MotionEvent event, float dx, float dy) {
            int action = event.getAction();
            PointF point = new PointF(event.getX(), event.getY());

            if(prevTouchAction == MotionEvent.ACTION_DOWN){
                mView.startPath();
                emitStrokeStart();
            }

            RCanvasPath mCurrentPath = mView.getCurrentPath();

            if(shouldFail(event)) {
                if(mCurrentPath != null) mView.end();
                event.setAction(MotionEvent.ACTION_CANCEL);
                prevTouchAction = action;
                return false;
            }

            if(mCurrentPath != null){
                mView.addPoint(point);
                if(mShouldFireOnStrokeChangedEvent) emitStrokeChanged(point);
            }

            prevTouchAction = action;
            return true;
        }

        @Override
        public boolean onSingleTapUp(MotionEvent motionEvent) {
            if(mShouldFireOnPressEvent) {
                if(!isLongPress) emitPress(motionEvent.getX(), motionEvent.getY(), ON_PRESS);
                return true;
            }
            return false;
        }
    }

    private boolean shouldFail(MotionEvent event){
        int action = event.getAction();
        return event.getPointerCount() != 1 || action == MotionEvent.ACTION_OUTSIDE || action == MotionEvent.ACTION_CANCEL;
    }

    public void emit(String eventName, WritableMap eventData){
        mEventDispatcher.dispatchEvent(RCanvasEvent.obtain(mView.getId(), eventName, eventData));
    }

    public void emitStrokeStart(){
        emit(STROKE_START, mView.getCurrentPath().toWritableMap(false));
    }

    public void emitStrokeChanged(PointF p){
        emitStrokeChanged(p.x, p.y);
    }

    public void emitStrokeChanged(float x, float y){
        WritableMap e = Arguments.createMap();
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        e.merge(mView.getCurrentPath().toWritableMap(false));
        emit(STROKE_CHANGED, e);
    }

    public void emitStrokeEnd(){
        emit(STROKE_END, mView.getCurrentPath().toWritableMap());
    }

    public void emitPathsChange(){
        WritableMap event = Arguments.createMap();
        WritableArray paths = Arguments.createArray();
        for (RCanvasPath path: mView.getPaths()) {
            paths.pushString(path.id);
        }
        event.putArray("paths", paths);
        emit(RCanvasEventHandler.PATHS_UPDATE, event);
    }

    public void emitSaveCanvas(boolean success, String path) {
        WritableMap event = Arguments.createMap();
        event.putBoolean("success", success);
        event.putString("path", path);
        emit(RCanvasEventHandler.ON_SKETCH_SAVED, event);
    }

    public void emitPress(float x, float y, String eventName){
        WritableMap e = Arguments.createMap();
        PathIntersectionHelper intersectionHelper = mView.getIntersectionHelper();
        e.putArray("paths", intersectionHelper.isPointOnPath(x, y));
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        if(intersectionHelper.getTouchRadius() > 0) e.putDouble("radius", PixelUtil.toDIPFromPixel(intersectionHelper.getTouchRadius()));
        emit(eventName, e);
    }

}
