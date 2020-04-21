package io.autodidact.reanimatedcanvas;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

import java.util.ArrayList;
import java.util.Map;

public class RCanvasEventDispatcher {
    @interface JSEventNames {
        String ON_CHANGE = "onChange";
    }

    public static Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put(JSEventNames.ON_CHANGE, MapBuilder.of("registrationName", JSEventNames.ON_CHANGE))
                .build();
    }

    private final EventDispatcher mEventDispatcher;
    private final RCanvasHandler mCanvas;

    public RCanvasEventDispatcher(ReactContext context, RCanvasHandler view){
        mEventDispatcher = context.getNativeModule(UIManagerModule.class).getEventDispatcher();
        mCanvas = view;
    }

    private void emit(@JSEventNames String eventName, WritableMap eventData){
        mEventDispatcher.dispatchEvent(RCanvasEvent.obtain(mCanvas.getId(), eventName, eventData));
    }

    void emitChange(
            @Nullable ArrayList<RPath> added,
            @Nullable ArrayList<RPath> changed,
            @Nullable ArrayList<RPath> removed
    ) {
        WritableNativeMap event = new WritableNativeMap();
        WritableNativeArray changedPaths = new WritableNativeArray();
        WritableNativeArray addedArray = new WritableNativeArray();
        WritableNativeArray changedArray = new WritableNativeArray();
        WritableNativeArray removedArray = new WritableNativeArray();

        if (changed != null) {
            for (RPath path: changed) {
                changedPaths.pushMap(path.toWritableMap(true));
                changedArray.pushInt(path.getPathId());
            }
        }

        if (added != null) {
            for (RPath path: added) {
                changedPaths.pushMap(path.toWritableMap(true));
                addedArray.pushInt(path.getPathId());
            }
        }

        if (removed != null) {
            for (RPath path: removed) {
                changedPaths.pushMap(path.toWritableMap(false));
                removedArray.pushInt(path.getPathId());
            }
        }

        event.putMap("state", mCanvas.mStateStack.peek().toWritableMap());
        event.putArray("paths", changedPaths);
        event.putArray("added", addedArray);
        event.putArray("changed", changedArray);
        event.putArray("removed", removedArray);

        emit(JSEventNames.ON_CHANGE, event);

        for (RPath path: mCanvas.mPaths) {
            path.getState().startListening();
        }
    }

}
