package com.autodidact.reanimatedcanvas;

import androidx.core.util.Pools;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class RCanvasEvent extends Event<RCanvasEvent> {

    private static final int TOUCH_EVENTS_POOL_SIZE = 7; // magic

    private static final Pools.SynchronizedPool<RCanvasEvent> EVENTS_POOL =
            new Pools.SynchronizedPool<>(TOUCH_EVENTS_POOL_SIZE);

    public static RCanvasEvent obtain(int viewTag, String eventName, WritableMap eventData) {
        RCanvasEvent event = EVENTS_POOL.acquire();
        if (event == null) {
            event = new RCanvasEvent();
        }
        event.init(viewTag, eventName, eventData);
        return event;
    }

    private WritableMap mExtraData;
    private String mEventName;

    private RCanvasEvent() {
    }

    protected void init(int viewTag, String eventName, WritableMap eventData) {
        super.init(viewTag);
        mEventName = eventName;
        mExtraData = eventData;
    }

    @Override
    public void onDispose() {
        mExtraData = null;
        EVENTS_POOL.release(this);
    }

    @Override
    public String getEventName() {
        return mEventName;
    }

    @Override
    public boolean canCoalesce() {
        // TODO: coalescing
        return false;
    }

    @Override
    public short getCoalescingKey() {
        // TODO: coalescing
        return 0;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), mEventName, mExtraData);
    }
}
