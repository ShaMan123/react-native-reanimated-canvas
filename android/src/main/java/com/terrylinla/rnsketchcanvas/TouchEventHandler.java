package com.terrylinla.rnsketchcanvas;

import android.content.Context;
import android.util.Log;
import android.view.MotionEvent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import static com.terrylinla.rnsketchcanvas.SketchCanvas.TAG;

public class TouchEventHandler {
    public final static String STROKE_START = "onStrokeStart";
    public final static String STROKE_CHANGED = "onStrokeChanged";
    public final static String STROKE_END = "onStrokeEnd";
    public final static float scale = getDeviceScale();

    private ThemedReactContext mContext;
    private int mTag;

    public TouchEventHandler(ThemedReactContext context, int tag){
        mContext = context;
        mTag = tag;
    }

    public void dispatchEvent(MotionEvent event){
        mContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mTag,
                getEventName(event),
                getEvent(event));
    }

    public static String getEventName(MotionEvent event){
        switch (event.getAction()){
            case MotionEvent.ACTION_DOWN: return STROKE_START;
            case MotionEvent.ACTION_MOVE: return STROKE_CHANGED;
            case MotionEvent.ACTION_UP: return STROKE_END;
            default: return STROKE_CHANGED;
        }
    }

    public static WritableMap getEvent(MotionEvent event){
        WritableMap e = Arguments.createMap();
        e.putDouble("x", event.getX() / scale);
        e.putDouble("y", event.getY() / scale);
        return e;
    }

    public static float getDeviceScale(){
        return DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }
}
