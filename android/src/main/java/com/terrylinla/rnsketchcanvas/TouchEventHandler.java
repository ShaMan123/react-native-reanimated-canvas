package com.terrylinla.rnsketchcanvas;

import android.content.Context;
import android.graphics.PointF;
import android.util.Log;
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
    public final static float scale = getDeviceScale();

    private SketchCanvas mView;
    private int prevTouchAction = -1;
    private boolean mShouldFireOnStrokeChangedEvent = false;
    private long eventStart = -1;
    PointF touchStart;
    private static int MAJOR_MOVE_THRESHOLD = 10;
    private boolean mShouldHandle = false;

    public TouchEventHandler(SketchCanvas view){
        mView = view;
    }

    public void setShouldFireOnStrokeChanged(boolean fire){
        mShouldFireOnStrokeChangedEvent = fire;
    }

    public boolean run(MotionEvent event){
        int action = event.getAction();
        long startTime = event.getDownTime();
        boolean isNewEvent = startTime != eventStart;
        PointF point = new PointF(event.getX(), event.getY());

        eventStart = startTime;

        SketchData mCurrentPath = mView.getCurrentPath();

        if(isNewEvent && mCurrentPath != null) mView.end();

        if(shouldFail(event)) {
            if(mCurrentPath != null) mView.end();
            event.setAction(MotionEvent.ACTION_CANCEL);
            prevTouchAction = action;
            return false;
        }

        if(shouldHandle(event)){
            if(mCurrentPath == null) {
                mView.newPath();
                emitOnStrokeStart();
            }
            Log.d(TAG, "onTouchEvent: " + event.toString());
            mView.addPoint(point);
            if(mShouldFireOnStrokeChangedEvent) emitOnStrokeChanged(point);
        }

        if(action == MotionEvent.ACTION_UP) {
            if(mCurrentPath != null){
                emitOnStrokeEnd();
                mView.end();
            }
            endEvent();
        }

        prevTouchAction = action;
        return true;
    }

    private boolean shouldFail(MotionEvent event){
        int action = event.getAction();
        boolean isSecondUp = action == MotionEvent.ACTION_UP && prevTouchAction == MotionEvent.ACTION_UP;
        if(isSecondUp) event.setAction(MotionEvent.ACTION_CANCEL);
        return event.getPointerCount() != 1 || action == MotionEvent.ACTION_OUTSIDE || action == MotionEvent.ACTION_CANCEL;
    }

    private boolean shouldHandle(MotionEvent event){
        PointF point = new PointF(event.getX(), event.getY());
        if(touchStart == null) touchStart = point;
        if(!mShouldHandle) {
            PointF offset = new PointF(Math.abs(touchStart.x - point.x), Math.abs(touchStart.y - point.y));
            boolean overThreshold = offset.x >= MAJOR_MOVE_THRESHOLD || offset.y >= MAJOR_MOVE_THRESHOLD;
            boolean moving = event.getAction() == MotionEvent.ACTION_MOVE && prevTouchAction == MotionEvent.ACTION_MOVE;
            mShouldHandle = moving && overThreshold;
        }
        return mShouldHandle;
    }

    private void endEvent(){
        touchStart = null;
        mShouldHandle = false;
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
