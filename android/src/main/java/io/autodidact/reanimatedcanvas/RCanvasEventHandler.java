package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ViewParent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

import java.util.Map;

public class RCanvasEventHandler {
    @interface JSEventNames {
        String STROKE_START = "onStrokeStart";
        String STROKE_CHANGED = "onStrokeChange";
        String STROKE_END = "onStrokeEnd";
        String ON_PRESS = "onPress";
        String ON_LONG_PRESS = "onLongPress";
        String ON_PATHS_CHANGE = "onPathsChange";
        String ON_UPDATE = "onUpdate";
    }

    public static Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put(JSEventNames.STROKE_START, MapBuilder.of("registrationName", JSEventNames.STROKE_START))
                .put(JSEventNames.STROKE_CHANGED, MapBuilder.of("registrationName", JSEventNames.STROKE_CHANGED))
                .put(JSEventNames.STROKE_END, MapBuilder.of("registrationName", JSEventNames.STROKE_END))
                .put(JSEventNames.ON_PRESS, MapBuilder.of("registrationName", JSEventNames.ON_PRESS))
                .put(JSEventNames.ON_LONG_PRESS, MapBuilder.of("registrationName", JSEventNames.ON_LONG_PRESS))
                .put(JSEventNames.ON_PATHS_CHANGE, MapBuilder.of("registrationName", JSEventNames.ON_PATHS_CHANGE))
                .put(JSEventNames.ON_UPDATE, MapBuilder.of("registrationName", JSEventNames.ON_UPDATE))
                .build();
    }

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
        final GestureListener gestureListener = new GestureListener();
        detector =  new GestureDetector(mView.getContext(), gestureListener) {
            @Override
            public boolean onTouchEvent(MotionEvent ev) {
                if(ev.getAction() == MotionEvent.ACTION_UP) {
                    gestureListener.endPath();
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
        private String pathId;

        private void endPath() {
            if (pathId != null) {
                mView.endInteraction(pathId);
                pathId = null;
            }
        }

        @Override
        public boolean onDown(MotionEvent event) {
            int action = event.getAction();
            endPath();
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
            if(mShouldFireOnLongPressEvent) emitPress(motionEvent.getX(), motionEvent.getY(), JSEventNames.ON_LONG_PRESS);
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
                pathId = mView.init();
                emitStrokeStart(pathId);
            }

            if(shouldFail(event)) {
                endPath();
                event.setAction(MotionEvent.ACTION_CANCEL);
                prevTouchAction = action;
                return false;
            }

            if (pathId != null){
                mView.drawPoint(pathId, point);
            }

            prevTouchAction = action;
            return true;
        }

        @Override
        public boolean onSingleTapUp(MotionEvent motionEvent) {
            if(mShouldFireOnPressEvent) {
                if(!isLongPress) emitPress(motionEvent.getX(), motionEvent.getY(), JSEventNames.ON_PRESS);
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
        //mEventDispatcher.dispatchEvent(RCanvasEvent.obtain(mView.getId(), eventName, eventData));
    }

    public void emitStrokeStart(String pathId) {
        emit(JSEventNames.STROKE_START, mView.getPath(pathId).toWritableMap(false));
    }

    public void maybeEmitStrokeChange(String pathId, PointF point) {
        if (mShouldFireOnStrokeChangedEvent) {
            WritableMap e = Arguments.createMap();
            e.putDouble("x", PixelUtil.toDIPFromPixel(point.x));
            e.putDouble("y", PixelUtil.toDIPFromPixel(point.y));
            e.merge(mView.getPath(pathId).toWritableMap(false));
            emit(JSEventNames.STROKE_CHANGED, e);
        }
    }

    public void emitStrokeEnd(String pathId){
        emit(JSEventNames.STROKE_END, mView.getPath(pathId).toWritableMap());
    }

    public void emitPathsChange(){
        WritableMap event = Arguments.createMap();
        WritableArray paths = Arguments.createArray();
        for (RCanvasPath path: mView.paths()) {
            paths.pushString(path.getPathId());
        }
        event.putArray("paths", paths);
        emit(JSEventNames.ON_PATHS_CHANGE, event);
    }

    public void emitPress(float x, float y, String eventName){
        WritableMap e = Arguments.createMap();
        PathIntersectionHelper intersectionHelper = mView.getIntersectionHelper();
        e.putArray("paths", intersectionHelper.isPointOnPath(new PointF(x, y)));
        e.putDouble("x", PixelUtil.toDIPFromPixel(x));
        e.putDouble("y", PixelUtil.toDIPFromPixel(y));
        emit(eventName, e);
    }

    void emitUpdate() {
        WritableNativeMap event = new WritableNativeMap();
        WritableNativeMap data = new WritableNativeMap();
        for (RCanvasPath path: mView.paths()) {
            data.putMap(path.getPathId(), path.toWritableMap());
        }
        event.putMap("paths", data);
        RCanvas.CanvasState currentState = mView.mStateStack.peek();
        event.putInt("strokeColor", currentState.strokeColor);
        event.putDouble("strokeWidth", PixelUtil.toDIPFromPixel(currentState.strokeWidth));
        emit(JSEventNames.ON_UPDATE, event);
    }
}
