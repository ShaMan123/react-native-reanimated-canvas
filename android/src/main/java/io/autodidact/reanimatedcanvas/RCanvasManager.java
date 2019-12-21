package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.view.View;

import androidx.annotation.IntDef;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringDef;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.Map;

public class RCanvasManager extends ReactViewManager {
    public static final String NAME = "ReanimatedCanvasManager";
    public static final String TAG = "RCanvas";

    private static final int ALLOC = 1;
    private static final int DRAW_POINT = 2;
    private static final int END_INTERACTION = 3;
    private static final int CLEAR = 4;
    private static final int ADD_PATHS = 5;
    private static final int REMOVE_PATHS = 6;
    private static final int SET_PATH_ATTRIBUTES = 7;

    private static final String COMMAND_ALLOC = "alloc";
    private static final String COMMAND_DRAW_POINT = "drawPoint";
    private static final String COMMAND_END_INTERACTION = "endInteraction";
    private static final String COMMAND_CLEAR = "clear";
    private static final String COMMAND_ADD_PATHS = "addPaths";
    private static final String COMMAND_REMOVE_PATHS = "removePaths";
    private static final String COMMAND_SET_PATH_ATTRIBUTES = "setAttributes";
    
    @Retention(RetentionPolicy.SOURCE)
    @IntDef({ALLOC, DRAW_POINT, END_INTERACTION, CLEAR, ADD_PATHS, REMOVE_PATHS, SET_PATH_ATTRIBUTES})
    @interface Commands {}

    @Retention(RetentionPolicy.SOURCE)
    @StringDef({COMMAND_ALLOC, COMMAND_DRAW_POINT, COMMAND_END_INTERACTION, COMMAND_CLEAR, COMMAND_ADD_PATHS, COMMAND_REMOVE_PATHS, COMMAND_SET_PATH_ATTRIBUTES})
    @interface StringCommands {}

    private @Commands int resolveCommand(@StringCommands String command) {
        switch (command) {
            case COMMAND_ALLOC: return ALLOC;
            case COMMAND_DRAW_POINT: return DRAW_POINT;
            case COMMAND_END_INTERACTION: return END_INTERACTION;
            case COMMAND_CLEAR: return CLEAR;
            case COMMAND_ADD_PATHS: return ADD_PATHS;
            case COMMAND_REMOVE_PATHS: return REMOVE_PATHS;
            case COMMAND_SET_PATH_ATTRIBUTES: return SET_PATH_ATTRIBUTES;
            default:
                throw new JSApplicationIllegalArgumentException(
                        String.format(
                                "Unsupported command %s received by %s.",
                                command,
                                getClass().getSimpleName())
                );
        }
    }

    @interface Props {
        String HARDWARE_ACCELERATED = "hardwareAccelerated";
        String STROKE_COLOR = "strokeColor";
        String STROKE_WIDTH = "strokeWidth";
        String TOUCH_ENABLED = "touchEnabled";
        String HIT_SLOP = "hitSlop";
        String HANDLE_TOUCHES_IN_NATIVE = "useNativeDriver";
        String ON_STROKE = "onStrokeChanged";
        String ON_PRESS = "onPress";
        String ON_LONG_PRESS = "onLongPress";
    }

    public RCanvasManager(){
        super();
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @Override
    @NonNull
    public RCanvas createViewInstance(@NonNull ThemedReactContext context) {
        return new RCanvas(context);
    }

    @Override
    public void onDropViewInstance(@NonNull ReactViewGroup view) {
        ((RCanvas) view).tearDown();
    }

    @Override
    protected void onAfterUpdateTransaction(@NonNull ReactViewGroup view) {
        super.onAfterUpdateTransaction(view);
        ((RCanvas) view).finalizeUpdate();
    }

    @Override
    public void addView(ReactViewGroup parent, View child, int index) {
        super.addView(parent, child, index);
        if (child instanceof RCanvasPath) {
            ((RCanvas) parent).finalizePathAddition((RCanvasPath) child);
        }
    }

    @Override
    public void removeViewAt(ReactViewGroup parent, int index) {
        View child = parent.getChildAt(index);
        super.removeViewAt(parent, index);
        if (child instanceof RCanvasPath) {
            ((RCanvas) parent).finalizePathRemoval((RCanvasPath) child);
        }
    }

    @ReactProp(name = Props.HARDWARE_ACCELERATED)
    public void setHardwareAccelerated(RCanvas viewContainer, boolean useAcceleration) {
        viewContainer.setHardwareAcceleration(useAcceleration);
    }

    @ReactProp(name = Props.STROKE_COLOR)
    public void setStrokeColor(RCanvas viewContainer, int color) {
        viewContainer.setStrokeColor(color);
    }

    @ReactProp(name = Props.STROKE_WIDTH)
    public void setStrokeWidth(RCanvas viewContainer, float width) {
        viewContainer.setStrokeWidth(PixelUtil.toPixelFromDIP(width));
    }

    @ReactProp(name = Props.TOUCH_ENABLED, defaultBoolean = true)
    public void setTouchState(RCanvas viewContainer, Dynamic propValue) {
        viewContainer.getEventHandler().setTouchState(new TouchState(propValue));
    }

    @Override
    public void setHitSlop(ReactViewGroup view, @Nullable ReadableMap hitSlop) {
        super.setHitSlop(view, hitSlop);
        ((RCanvas) view).setHitSlop(Utility.parseHitSlop(hitSlop));
    }

    @ReactProp(name = Props.HANDLE_TOUCHES_IN_NATIVE)
    public void shouldHandleTouches(RCanvas viewContainer, boolean handle) {
        viewContainer.getEventHandler().setShouldHandleTouches(handle);
    }

    @ReactProp(name = Props.ON_STROKE)
    public void shouldFireOnStrokeEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnStrokeChangedEvent(callback != null);
    }

    @ReactProp(name = Props.ON_PRESS)
    public void shouldFireOnPressEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnPressEvent(callback != null);
    }

    @ReactProp(name = Props.ON_LONG_PRESS)
    public void shouldFireOnLongPressEvent(RCanvas viewContainer, @Nullable Dynamic callback) {
        viewContainer.getEventHandler().setShouldFireOnLongPressEvent(callback != null);
    }
/*
    @Override
    public void receiveCommand(ReactViewGroup root, String commandId, @Nullable ReadableArray args) {
        receiveCommand(root, resolveCommand(commandId), args);
    }
*/
    @Override
    public void receiveCommand(@NonNull ReactViewGroup root, @Commands int command, @Nullable ReadableArray args) {
        RCanvas view = ((RCanvas) root);
        switch (command) {
            case ALLOC: {
                String id = args.getString(0);
                Integer strokeColor = !args.isNull(1) ? args.getInt(1) : null;
                Float strokeWidth = !args.isNull(2) ? PixelUtil.toPixelFromDIP(args.getDouble(2)) : null;
                view.init(id, strokeColor, strokeWidth);
                return;
            }
            case DRAW_POINT: {
                String id = args.getString(0);
                float x = PixelUtil.toPixelFromDIP(args.getDouble(1));
                float y = PixelUtil.toPixelFromDIP(args.getDouble(2));
                view.drawPoint(id, new PointF(x, y));
                return;
            }
            case END_INTERACTION: {
                String id = args.getString(0);
                view.endInteraction(id);
                return;
            }
            case CLEAR: {
                view.clear();
                return;
            }
            case ADD_PATHS: {
                view.addPaths(args);
                return;
            }
            case REMOVE_PATHS: {
                view.removePaths(args);
                return;
            }
            case SET_PATH_ATTRIBUTES: {
                String id = args.getString(0);
                ReadableMap attributes = args.getMap(1);
                view.setAttributes(id, attributes);
                return;
            }
            default:
                throw new JSApplicationIllegalArgumentException(
                        String.format(
                                "Unsupported command %d received by %s.",
                                command,
                                getClass().getSimpleName())
                );
        }
    }

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.<String, Integer>builder()
                .put(COMMAND_ALLOC, ALLOC)
                .put(COMMAND_DRAW_POINT, DRAW_POINT)
                .put(COMMAND_END_INTERACTION, END_INTERACTION)
                .put(COMMAND_CLEAR, CLEAR)
                .put(COMMAND_ADD_PATHS, ADD_PATHS)
                .put(COMMAND_REMOVE_PATHS, REMOVE_PATHS)
                .put(COMMAND_SET_PATH_ATTRIBUTES, SET_PATH_ATTRIBUTES)
                .build();

    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return RCanvasEventHandler.getExportedCustomDirectEventTypeConstants();
    }

}
