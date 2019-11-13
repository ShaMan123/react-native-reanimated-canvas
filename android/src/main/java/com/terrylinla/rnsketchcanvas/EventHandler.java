package com.terrylinla.rnsketchcanvas;

import android.content.Context;
import android.graphics.PointF;
import android.util.Log;
import android.view.GestureDetector;
import android.view.MotionEvent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import javax.annotation.Nullable;

import static com.terrylinla.rnsketchcanvas.SketchCanvas.TAG;

public class EventHandler {
    public final static String STROKE_START = "onStrokeStart";
    public final static String STROKE_CHANGED = "onStrokeChanged";
    public final static String STROKE_END = "onStrokeEnd";
    public final static String ON_PRESS = "onPress";
    public final static String ON_LONG_PRESS = "onLongPress";
    public final static String PATHS_UPDATE = "pathsUpdate";
    public final static String ON_SKETCH_SAVED = "onSketchSaved";

    private SketchCanvas mView;
    private int prevTouchAction = -1;
    private boolean mShouldFireOnStrokeChangedEvent = false;
    private boolean mShouldFireOnPressEvent = false;
    private boolean mShouldFireOnLongPressEvent = false;
    private boolean mShouldHandleTouches = true;

    private GestureDetector detector;
    private EventDispatcher mEventDispatcher;

    public EventHandler(SketchCanvas view){
        mView = view;
        mEventDispatcher = ((ReactContext) view.getContext()).getNativeModule(UIManagerModule.class).getEventDispatcher();
        detector =  new GestureDetector(mView.getContext(), new GestureListener()){
            @Override
            public boolean onTouchEvent(MotionEvent ev) {
                if(ev.getAction() == MotionEvent.ACTION_UP && mView.getCurrentPath() != null) {
                    emitOnStrokeEnd();
                    mView.end();
                }
                return super.onTouchEvent(ev);
            }
        };
    }

    public void setShouldFireOnStrokeChangedEvent(boolean fire){
        mShouldFireOnStrokeChangedEvent = fire;
    }

    public void setShouldFireOnPressEvent(boolean shouldFireEvent) {
        this.mShouldFireOnPressEvent = shouldFireEvent;
    }

    public void setShouldFireOnLongPressEvent(boolean shouldFireEvent) {
        this.mShouldFireOnLongPressEvent = shouldFireEvent;
    }

    public void setShouldHandleTouches(boolean shouldHandleTouches) {
        this.mShouldHandleTouches = shouldHandleTouches;
    }

    public boolean onTouchEvent(MotionEvent ev){
        return mShouldHandleTouches && mView.getTouchState().enabled() && detector.onTouchEvent(ev);
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
                mView.newPath();
                emitOnStrokeStart();
            }

            SketchData mCurrentPath = mView.getCurrentPath();

            if(shouldFail(event)) {
                if(mCurrentPath != null) mView.end();
                event.setAction(MotionEvent.ACTION_CANCEL);
                prevTouchAction = action;
                return false;
            }

            if(mCurrentPath != null){
                mView.addPoint(point);
                if(mShouldFireOnStrokeChangedEvent) emitOnStrokeChanged(point);
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
        mEventDispatcher.dispatchEvent(SketchEvent.obtain(mView.getId(), eventName, eventData));
    }

    public void emitOnStrokeStart(){
        emit(STROKE_START, mView.getCurrentPath().getMap(false));
    }

    public void emitOnStrokeChanged(PointF p){
        emitOnStrokeChanged(p.x, p.y);
    }

    public void emitOnStrokeChanged(float x, float y){
        WritableMap e = Arguments.createMap();
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        e.merge(mView.getCurrentPath().getMap(false));
        emit(STROKE_CHANGED, e);
    }

    public void emitOnStrokeEnd(){
        emit(STROKE_END, mView.getCurrentPath().getMap());
    }

    public void emitPress(float x, float y, String eventName){
        WritableMap e = Arguments.createMap();
        e.putArray("paths", mView.isPointOnPath(x, y));
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        if(mView.getTouchRadius() > 0) e.putDouble("radius", PixelUtil.toDIPFromPixel(mView.getTouchRadius()));
        emit(eventName, e);
    }

    public static String getEventName(MotionEvent event){
        switch (event.getAction()){
            case MotionEvent.ACTION_DOWN: return STROKE_START;
            default: return STROKE_CHANGED;
        }
    }

    public static float getDeviceScale(){
        return DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }
}
