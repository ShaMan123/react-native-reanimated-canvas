package com.autodidact.reanimatedcanvas;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.HashMap;
import java.util.Map;

public class RCanvasManager extends SimpleViewManager<RCanvas> {
    public static final String NAME = "ReanimatedCanvasManager";

    /*
    public static final String COMMAND_ADD_POINT = "addPoint";
    public static final String COMMAND_START_PATH = "startPath";
    public static final String COMMAND_CLEAR = "clear";
    public static final String COMMAND_ADD_PATHS = "addPaths";
    public static final String COMMAND_DELETE_PATHS = "deletePaths";
    public static final String COMMAND_SAVE = "save";
    public static final String COMMAND_END_PATH = "endPath";
    public static final String COMMAND_CHANGE_PATH = "changePath";
    public static final String COMMAND_SET_PATH_ATTRIBUTES = "setAttributes";


     */

    public static final int COMMAND_ADD_POINT = 1;
    public static final int COMMAND_START_PATH = 2;
    public static final int COMMAND_CLEAR = 3;
    public static final int COMMAND_ADD_PATHS = 4;
    public static final int COMMAND_DELETE_PATHS = 5;
    public static final int COMMAND_SAVE = 6;
    public static final int COMMAND_END_PATH = 7;
    public static final int COMMAND_CHANGE_PATH = 8;
    public static final int COMMAND_SET_PATH_ATTRIBUTES = 9;

    private static final String PROPS_LOCAL_SOURCE_IMAGE = "localSourceImage";
    private static final String PROPS_TEXT = "text";
    private static final String PROPS_HARDWARE_ACCELERATED = "hardwareAccelerated";
    private static final String PROPS_STROKE_COLOR = "strokeColor";
    private static final String PROPS_STROKE_WIDTH = "strokeWidth";
    private static final String PROPS_TOUCH_ENABLED = "touchEnabled";
    private static final String PROPS_HANDLE_TOUCHES_IN_NATIVE = "useNativeDriver";
    private static final String PROPS_ON_STROKE = "onStrokeChanged";
    private static final String PROPS_ON_PRESS = "onPress";
    private static final String PROPS_ON_LONG_PRESS = "onLongPress";

    RCanvasManager(){
        super();
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @Override
    @NonNull
    protected RCanvas createViewInstance(@NonNull ThemedReactContext context) {
        return new RCanvas(context);
    }

    @Override
    public void onDropViewInstance(@NonNull RCanvas view) {
        if (BuildConfig.DEBUG) Log.i(ReactConstants.TAG, "Tearing down RCanvas " +  view.toString());
        view.tearDown();
    }

    @ReactProp(name = PROPS_LOCAL_SOURCE_IMAGE)
    public void setLocalSourceImage(RCanvas viewContainer, ReadableMap localSourceImage) {
        if (localSourceImage != null && localSourceImage.getString("filename") != null) {
            viewContainer.getImageHelper().openImageFile(
                    localSourceImage.hasKey("filename") ? localSourceImage.getString("filename") : null,
                    localSourceImage.hasKey("directory") ? localSourceImage.getString("directory") : "",
                    localSourceImage.hasKey("mode") ? localSourceImage.getString("mode") : ""
            );
        }
    }

    @ReactProp(name = PROPS_TEXT)
    public void setText(RCanvas viewContainer, ReadableArray text) {
        viewContainer.getTextHelper().setText(text);
    }

    @ReactProp(name = PROPS_HARDWARE_ACCELERATED)
    public void setHardwareAccelerated(RCanvas viewContainer, boolean useAcceleration) {
        viewContainer.setHardwareAccelerated(useAcceleration);
    }

    @ReactProp(name = PROPS_STROKE_COLOR)
    public void setStrokeColor(RCanvas viewContainer, int color) {
        viewContainer.setStrokeColor(color);
    }

    @ReactProp(name = PROPS_STROKE_WIDTH)
    public void setStrokeWidth(RCanvas viewContainer, int width) {
        viewContainer.setStrokeWidth((int) PixelUtil.toPixelFromDIP(width));
    }

    @ReactProp(name = PROPS_TOUCH_ENABLED, defaultBoolean = true)
    public void setTouchState(RCanvas viewContainer, Dynamic propValue) {
        viewContainer.getEventHandler().setTouchState(new TouchState(propValue));
    }

    @ReactProp(name = PROPS_HANDLE_TOUCHES_IN_NATIVE)
    public void shouldHandleTouches(RCanvas viewContainer, boolean handle) {
        viewContainer.getEventHandler().setShouldHandleTouches(handle);
    }

    @ReactProp(name = PROPS_ON_STROKE)
    public void shouldFireOnStrokeEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnStrokeChangedEvent(callback != null);
    }

    @ReactProp(name = PROPS_ON_PRESS)
    public void shouldFireOnPressEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnPressEvent(callback != null);
    }

    @ReactProp(name = PROPS_ON_LONG_PRESS)
    public void shouldFireOnLongPressEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnLongPressEvent(callback != null);
    }

    @Override
    protected void addEventEmitters(ThemedReactContext reactContext, RCanvas view) {
        //super.addEventEmitters(reactContext, view);
    }

    @Override
    public void receiveCommand(@NonNull RCanvas view, int command, @Nullable ReadableArray args) {
        Log.d("RCanvas", "receiveCommand: " + getCommandsMap().containsValue(command) + " " + command);
        switch (command) {
            case COMMAND_ADD_POINT: {
                float x = PixelUtil.toPixelFromDIP(args.getDouble(0));
                float y = PixelUtil.toPixelFromDIP(args.getDouble(1));
                @Nullable String id = args.size() == 3 ? args.getString(2) : null;
                view.addPoint(x, y, id);
                return;
            }
            case COMMAND_START_PATH: {
                String id = args.getString(0);
                int strokeColor = args.getInt(1);
                float strokeWidth = PixelUtil.toPixelFromDIP(args.getDouble(2));
                view.startPath(id, strokeColor, strokeWidth);
                return;
            }
            case COMMAND_CLEAR: {
                view.clear();
                return;
            }
            case COMMAND_ADD_PATHS: {
                view.addPaths(args);
                return;
            }
            case COMMAND_DELETE_PATHS: {
                view.deletePaths(args);
                return;
            }
            case COMMAND_SAVE: {
                view.getImageHelper()
                        .save(
                                args.getString(0),
                                args.getString(1),
                                args.getString(2),
                                args.getBoolean(3),
                                args.getBoolean(4),
                                args.getBoolean(5),
                                args.getBoolean(6)
                        );
                return;
            }
            case COMMAND_END_PATH: {
                view.end();
                return;
            }
            case COMMAND_CHANGE_PATH: {
                String id = args.getString(0);
                view.setCurrentPath(id);
                return;
            }
            case COMMAND_SET_PATH_ATTRIBUTES: {
                String id = args.getString(0);
                ReadableMap attributes = args.getMap(1);
                view.setAttributes(id, attributes);
                return;
            }
            default:
                throw new JSApplicationIllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        command,
                        getClass().getSimpleName()));
        }
    }

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        /*
        return MapBuilder.<String, String>builder()
                .put(COMMAND_ADD_POINT, COMMAND_ADD_POINT)
                .put(COMMAND_START_PATH, COMMAND_START_PATH)
                .put(COMMAND_CLEAR,COMMAND_CLEAR)
                .put(COMMAND_ADD_PATHS,COMMAND_ADD_PATHS)
                .put(COMMAND_DELETE_PATHS,COMMAND_DELETE_PATHS)
                .put(COMMAND_SAVE,COMMAND_SAVE)
                .put(COMMAND_END_PATH,COMMAND_END_PATH)
                .build();

         */
        Map<String, Integer> map = new HashMap<>();

        map.put("addPoint", COMMAND_ADD_POINT);
        map.put("startPath", COMMAND_START_PATH);
        map.put("clear", COMMAND_CLEAR);
        map.put("addPaths", COMMAND_ADD_PATHS);
        map.put("deletePaths", COMMAND_DELETE_PATHS);
        map.put("save", COMMAND_SAVE);
        map.put("endPath", COMMAND_END_PATH);
        map.put("changePath", COMMAND_CHANGE_PATH);
        map.put("setPathAttributes", COMMAND_SET_PATH_ATTRIBUTES);


        return map;
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put(RCanvasEventHandler.STROKE_START, MapBuilder.of("registrationName", RCanvasEventHandler.STROKE_START))
                .put(RCanvasEventHandler.STROKE_CHANGED, MapBuilder.of("registrationName", RCanvasEventHandler.STROKE_CHANGED))
                .put(RCanvasEventHandler.STROKE_END, MapBuilder.of("registrationName", RCanvasEventHandler.STROKE_END))
                .put(RCanvasEventHandler.ON_PRESS, MapBuilder.of("registrationName", RCanvasEventHandler.ON_PRESS))
                .put(RCanvasEventHandler.ON_LONG_PRESS, MapBuilder.of("registrationName", RCanvasEventHandler.ON_LONG_PRESS))
                .put(RCanvasEventHandler.ON_PATHS_CHANGE, MapBuilder.of("registrationName", RCanvasEventHandler.ON_PATHS_CHANGE))
                .put(RCanvasEventHandler.ON_SKETCH_SAVED, MapBuilder.of("registrationName", RCanvasEventHandler.ON_SKETCH_SAVED))
                .build();
    }
}
