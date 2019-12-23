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

    void emitChange(ArrayList<RCanvasPath> prev, ArrayList<RCanvasPath> curr) {

    }

    void emitChange(
            @Nullable ArrayList<RCanvasPath> added,
            @Nullable ArrayList<RCanvasPath> changed,
            @Nullable ArrayList<RCanvasPath> removed
    ) {
        WritableNativeMap event = new WritableNativeMap();
        WritableNativeMap changedPaths = new WritableNativeMap();
        WritableNativeArray addedArray = new WritableNativeArray();
        WritableNativeArray changedArray = new WritableNativeArray();
        WritableNativeArray removedArray = new WritableNativeArray();

        if (changed != null) {
            for (RCanvasPath path: changed) {
                changedPaths.putMap(path.getPathId(), path.toWritableMap(true));
                changedArray.pushString(path.getPathId());
            }
        }

        if (added != null) {
            for (RCanvasPath path: added) {
                changedPaths.putMap(path.getPathId(), path.toWritableMap(false));
                addedArray.pushString(path.getPathId());
            }
        }

        if (removed != null) {
            for (RCanvasPath path: removed) {
                changedPaths.putNull(path.getPathId());
                removedArray.pushString(path.getPathId());
            }
        }

        event.putMap("state", mCanvas.mStateStack.peek().toWritableMap());
        event.putMap("paths", changedPaths);
        event.putArray("added", addedArray);
        event.putArray("changed", changedArray);
        event.putArray("removed", removedArray);

        emit(JSEventNames.ON_CHANGE, event);
    }

}
