package com.autodidact.reanimatedcanvas;

import android.util.Log;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.Nullable;

public class RCanvasManager extends SimpleViewManager<RCanvas> {
    public static final String NAME = "ReanimatedCanvasManager";

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
    public String getName() {
        return NAME;
    }

    @Override
    protected RCanvas createViewInstance(ThemedReactContext context) {
        return new RCanvas(context);
    }

    @Override
    public void onDropViewInstance(RCanvas view) {
        if (BuildConfig.DEBUG) Log.i(getName(), "Tearing down SketchCanvas " +  view.toString());
        view.tearDown();
    }

    @ReactProp(name = PROPS_LOCAL_SOURCE_IMAGE)
    public void setLocalSourceImage(RCanvas viewContainer, ReadableMap localSourceImage) {
        if (localSourceImage != null && localSourceImage.getString("filename") != null) {
            viewContainer.openImageFile(
                    localSourceImage.hasKey("filename") ? localSourceImage.getString("filename") : null,
                    localSourceImage.hasKey("directory") ? localSourceImage.getString("directory") : "",
                    localSourceImage.hasKey("mode") ? localSourceImage.getString("mode") : ""
            );
        }
    }

    @ReactProp(name = PROPS_TEXT)
    public void setText(RCanvas viewContainer, ReadableArray text) {
        viewContainer.setCanvasText(text);
    }

    @ReactProp(name = PROPS_HARDWARE_ACCELERATED, defaultBoolean = false)
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
        viewContainer.setTouchState(new TouchState(propValue));
    }

    @ReactProp(name = PROPS_HANDLE_TOUCHES_IN_NATIVE, defaultBoolean = false)
    public void shouldHandleTouches(RCanvas viewContainer, boolean handle) {
        viewContainer.getEventHandler().setShouldHandleTouches(handle);
    }

    @ReactProp(name = PROPS_ON_STROKE, defaultBoolean = false)
    public void shouldFireOnStrokeEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnStrokeChangedEvent(callback != null);
    }

    @ReactProp(name = PROPS_ON_PRESS, defaultBoolean = false)
    public void shouldFireOnPressEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnPressEvent(callback != null);
    }

    @ReactProp(name = PROPS_ON_LONG_PRESS, defaultBoolean = false)
    public void shouldFireOnLongPressEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnLongPressEvent(callback != null);
    }

    @Override
    public Map<String, Integer> getCommandsMap() {
        /*
        return MapBuilder.<String, Object>builder()
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

    @Override
    protected void addEventEmitters(ThemedReactContext reactContext, RCanvas view) {
        //super.addEventEmitters(reactContext, view);
    }

    @Override
    public void receiveCommand(RCanvas view, int commandType, @Nullable ReadableArray args) {
        switch (commandType) {
            case COMMAND_ADD_POINT: {
                view.addPoint(PixelUtil.toPixelFromDIP(args.getDouble(0)), PixelUtil.toPixelFromDIP(args.getDouble(1)));
                return;
            }
            case COMMAND_START_PATH: {
                view.startPath(args.getString(0), args.getInt(1), PixelUtil.toPixelFromDIP(args.getDouble(2)));
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
                for (int k = 0; k < args.size(); k++) {
                    view.deletePath(args.getString(k));
                }
                return;
            }
            case COMMAND_SAVE: {
                view.save(args.getString(0), args.getString(1), args.getString(2), args.getBoolean(3), args.getBoolean(4), args.getBoolean(5), args.getBoolean(6));
                return;
            }
            case COMMAND_END_PATH: {
                view.end();
                return;
            }
            case COMMAND_CHANGE_PATH: {
                view.setCurrentPath(args.getString(0));
                return;
            }
            case COMMAND_SET_PATH_ATTRIBUTES: {
                view.setAttributes(args.getString(0), args.getMap(1));
                return;
            }
            default:
                throw new JSApplicationIllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        commandType,
                        getClass().getSimpleName()));
        }
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
                .put(RCanvasEventHandler.PATHS_UPDATE, MapBuilder.of("registrationName", RCanvasEventHandler.PATHS_UPDATE))
                .put(RCanvasEventHandler.ON_SKETCH_SAVED, MapBuilder.of("registrationName", RCanvasEventHandler.ON_SKETCH_SAVED))
                .build();
    }
}
