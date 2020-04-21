package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ViewParent;

public class RCanvasEventHandler {
    private final RCanvas mView;
    private TouchState mTouchState;
    private int prevTouchAction = -1;
    private final GestureDetector detector;
    private final EventListener mEventListener;

    public RCanvasEventHandler(RCanvas view, EventListener eventListener){
        mView = view;
        mEventListener = eventListener;
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

    public boolean onTouchEvent(MotionEvent ev){
        return mTouchState.enabled() && detector.onTouchEvent(ev);
    }

    private boolean shouldFail(MotionEvent event){
        int action = event.getAction();
        return event.getPointerCount() != 1 || action == MotionEvent.ACTION_OUTSIDE || action == MotionEvent.ACTION_CANCEL;
    }

    private class GestureListener implements GestureDetector.OnGestureListener {
        private boolean isLongPress;
        private int pathId = 0;

        private void endPath() {
            if (pathId != 0) {
                mView.endInteraction(pathId);
                mEventListener.emitStrokeEnd(pathId);
                pathId = 0;
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
            mEventListener.emitLongPress(new PointF(motionEvent.getX(), motionEvent.getY()));
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
                mEventListener.emitStrokeStart(pathId);
            }

            if(shouldFail(event)) {
                endPath();
                event.setAction(MotionEvent.ACTION_CANCEL);
                prevTouchAction = action;
                return false;
            }

            if (pathId != 0){
                mView.drawPoint(pathId, point);
                mEventListener.emitStrokeChange(pathId, point);
            }

            prevTouchAction = action;
            return true;
        }

        @Override
        public boolean onSingleTapUp(MotionEvent motionEvent) {
            if(mEventListener.shouldEmitPress) {
                if(!isLongPress) mEventListener.emitPress(new PointF(motionEvent.getX(), motionEvent.getY()));
                return true;
            }
            return false;
        }
    }

    abstract class EventListener {
        abstract void onStrokeStart(int id);
        abstract void onStrokeChange(int id, PointF point);
        abstract void onStrokeEnd(int id);
        abstract void onPress(PointF point);
        abstract void onLongPress(PointF point);

        private void emitStrokeStart(int id) {
            if (shouldEmitStrokeStart) {
                onStrokeStart(id);
            }
        }

        private void emitStrokeChange(int id, PointF point) {
            if (shouldEmitStrokeChange) {
                onStrokeChange(id, point);
            }
        }

        private void emitStrokeEnd(int id) {
            if (shouldEmitStrokeEnd) {
                onStrokeEnd(id);
            }
        }

        private void emitPress(PointF point) {
            if (shouldEmitPress) {
                onPress(point);
            }
        }

        private void emitLongPress(PointF point) {
            if (shouldEmitLongPress) {
               onLongPress(point);
            }
        }
        
        protected boolean shouldEmitStrokeStart = false;
        protected boolean shouldEmitStrokeChange = false;
        protected boolean shouldEmitStrokeEnd = false;
        protected boolean shouldEmitPress = false;
        protected boolean shouldEmitLongPress = false;
    }
}
