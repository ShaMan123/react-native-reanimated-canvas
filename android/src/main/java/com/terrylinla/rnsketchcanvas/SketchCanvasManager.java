package com.terrylinla.rnsketchcanvas;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.util.Log;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import android.graphics.PointF;

import javax.annotation.Nullable;

public class SketchCanvasManager extends SimpleViewManager<SketchCanvas> {
    public static final int COMMAND_ADD_POINT = 1;
    public static final int COMMAND_NEW_PATH = 2;
    public static final int COMMAND_CLEAR = 3;
    public static final int COMMAND_ADD_PATHS = 4;
    public static final int COMMAND_DELETE_PATHS = 5;
    public static final int COMMAND_SAVE = 6;
    public static final int COMMAND_END_PATH = 7;

    private static final String PROPS_LOCAL_SOURCE_IMAGE = "localSourceImage";
    private static final String PROPS_TEXT = "text";
    private static final String PROPS_HARDWARE_ACCELERATED = "hardwareAccelerated";
    private static final String PROPS_STROKE_COLOR = "strokeColor";
    private static final String PROPS_STROKE_WIDTH = "strokeWidth";
    private static final String PROPS_TOUCH_ENABLED = "touchEnabled";
    private static final String PROPS_ON_STROKE = "onStrokeChanged";

    @Override
    public String getName() {
        return "RNSketchCanvas";
    }

    @Override
    protected SketchCanvas createViewInstance(ThemedReactContext context) {
        return new SketchCanvas(context);
    }

    @Override
    public void onDropViewInstance(SketchCanvas view) {
        Log.i(getName(), "Tearing down SketchCanvas " +  view.toString());
        view.tearDown();
    }

    @ReactProp(name = PROPS_LOCAL_SOURCE_IMAGE)
    public void setLocalSourceImage(SketchCanvas viewContainer, ReadableMap localSourceImage) {
        if (localSourceImage != null && localSourceImage.getString("filename") != null) {
            viewContainer.openImageFile(
                    localSourceImage.hasKey("filename") ? localSourceImage.getString("filename") : null,
                    localSourceImage.hasKey("directory") ? localSourceImage.getString("directory") : "",
                    localSourceImage.hasKey("mode") ? localSourceImage.getString("mode") : ""
            );
        }
    }

    @ReactProp(name = PROPS_TEXT)
    public void setText(SketchCanvas viewContainer, ReadableArray text) {
        viewContainer.setCanvasText(text);
    }

    @ReactProp(name = PROPS_HARDWARE_ACCELERATED)
    public void setHardwareAccelerated(SketchCanvas viewContainer, boolean useAcceleration) {
        viewContainer.setHardwareAccelerated(useAcceleration);
    }

    @ReactProp(name = PROPS_STROKE_COLOR)
    public void setStrokeColor(SketchCanvas viewContainer, int color) {
        viewContainer.setStrokeColor(color);
    }

    @ReactProp(name = PROPS_STROKE_WIDTH)
    public void setStrokeWidth(SketchCanvas viewContainer, int width) {
        viewContainer.setStrokeWidth((int) PixelUtil.toPixelFromDIP(width));
    }

    @ReactProp(name = PROPS_TOUCH_ENABLED)
    public void setTouchState(SketchCanvas viewContainer, boolean enabled) {
        viewContainer.setTouchState(enabled);
    }

    @ReactProp(name = PROPS_TOUCH_ENABLED)
    public void setTouchState(SketchCanvas viewContainer, String state) {
        viewContainer.setTouchState(state);
    }

    @ReactProp(name = PROPS_TOUCH_ENABLED)
    public void setTouchState(SketchCanvas viewContainer, int state) {
        viewContainer.setTouchState(state);
    }

    @ReactProp(name = PROPS_ON_STROKE)
    public void shouldFireOnStrokeEvent(SketchCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.setShouldFireOnStrokeChangedEvent(callback != null);
    }

    @Override
    public Map<String,Integer> getCommandsMap() {
        Map<String, Integer> map = new HashMap<>();

        map.put("addPoint", COMMAND_ADD_POINT);
        map.put("newPath", COMMAND_NEW_PATH);
        map.put("clear", COMMAND_CLEAR);
        map.put("addPaths", COMMAND_ADD_PATHS);
        map.put("deletePaths", COMMAND_DELETE_PATHS);
        map.put("save", COMMAND_SAVE);
        map.put("endPath", COMMAND_END_PATH);


        return map;
    }

    @Override
    protected void addEventEmitters(ThemedReactContext reactContext, SketchCanvas view) {

    }

    @Override
    public void receiveCommand(SketchCanvas view, int commandType, @Nullable ReadableArray args) {
        switch (commandType) {
            case COMMAND_ADD_POINT: {
                view.addPoint(PixelUtil.toPixelFromDIP(args.getDouble(0)), PixelUtil.toPixelFromDIP(args.getDouble(1)));
                return;
            }
            case COMMAND_NEW_PATH: {
                view.newPath(args.getString(0), args.getInt(1), PixelUtil.toPixelFromDIP(args.getDouble(2)));
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
            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        commandType,
                        getClass().getSimpleName()));
        }
    }
}
