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
import com.facebook.react.uimanager.events.RCTEventEmitter;

import javax.annotation.Nullable;

import static com.terrylinla.rnsketchcanvas.SketchCanvas.TAG;

public class TouchEventHandler {
    public final static String STROKE_START = "onStrokeStart";
    public final static String STROKE_CHANGED = "onStrokeChanged";
    public final static String STROKE_END = "onStrokeEnd";
    public final static String ON_PRESS = "onPress";
    public final static float scale = getDeviceScale();

    private SketchCanvas mView;
    private int prevTouchAction = -1;
    private boolean mShouldFireOnStrokeChangedEvent = false;
    private boolean mShouldFireOnPressEvent = false;
    private boolean mShouldHandleTouches = true;

    private GestureDetector detector;

    public TouchEventHandler(SketchCanvas view){
        mView = view;
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

    public void setShouldFireOnPressEvent(boolean shouldFireOnPressEvent) {
        this.mShouldFireOnPressEvent = shouldFireOnPressEvent;
    }

    public void setShouldHandleTouches(boolean shouldHandleTouches) {
        this.mShouldHandleTouches = shouldHandleTouches;
    }

    public boolean onTouchEvent(MotionEvent ev){
        return mShouldHandleTouches && detector.onTouchEvent(ev);
    }

    private class GestureListener implements GestureDetector.OnGestureListener {
        @Override
        public boolean onDown(MotionEvent event) {
            int action = event.getAction();
            if(mView.getCurrentPath() != null) mView.end();
            prevTouchAction = action;
            return true;
        }

        @Override
        public void onShowPress(MotionEvent motionEvent) {

        }

        @Override
        public void onLongPress(MotionEvent motionEvent) {

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
            Log.d(TAG, "onScroll: " + motionEvent.toString());
            if(mShouldFireOnPressEvent){
                emitOnPress(motionEvent.getX(), motionEvent.getY());
            }
            return false;
        }
    }

    private boolean shouldFail(MotionEvent event){
        int action = event.getAction();
        return event.getPointerCount() != 1 || action == MotionEvent.ACTION_OUTSIDE || action == MotionEvent.ACTION_CANCEL;
    }

    public void emit(String JSEventName, WritableMap e){
        ((ReactContext) mView.getContext())
                .getJSModule(RCTEventEmitter.class)
                .receiveEvent(
                        mView.getId(),
                        JSEventName,
                        e
                );
    }

    public void emitOnStrokeStart(){
        emit(STROKE_START, mView.getCurrentPath().getMap());
    }

    public void emitOnStrokeChanged(PointF p){
        emitOnStrokeChanged(p.x, p.y);
    }

    public void emitOnStrokeChanged(float x, float y){
        WritableMap e = Arguments.createMap();
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        e.putString("id", mView.getCurrentPath().id);
        emit(STROKE_CHANGED, e);
    }

    public void emitOnStrokeEnd(){
        emit(STROKE_END, mView.getCurrentPath().getMap());
    }

    public void emitOnPress(float x, float y){
        WritableMap e = Arguments.createMap();
        e.putArray("paths", mView.isPointOnPath(x, y));
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        if(mView.getTouchRadius() > 0) e.putDouble("radius", PixelUtil.toDIPFromPixel(mView.getTouchRadius()));
        emit(ON_PRESS, e);
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
