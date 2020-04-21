package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.view.View;

import androidx.annotation.IntDef;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringDef;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.Map;

import io.autodidact.reanimatedcanvas.RPath.ResizeMode;

public class RCanvasManager extends ReactViewManager {
    static final String NAME = "ReanimatedCanvasManager";
    static final String TAG = "RCanvas";

    @interface Props {
        String STROKE_COLOR = "strokeColor";
        String STROKE_WIDTH = "strokeWidth";
        String HIT_SLOP = "hitSlop";
        String DEBUG = "debug";
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
    public RCanvasHandler createViewInstance(@NonNull ThemedReactContext context) {
        return new RCanvasHandler(context);
    }

    @Override
    public void onDropViewInstance(@NonNull ReactViewGroup view) {
        ((RCanvasHandler) view).tearDown();
    }

    @Override
    protected void onAfterUpdateTransaction(@NonNull ReactViewGroup view) {
        super.onAfterUpdateTransaction(view);
        ((RCanvasHandler) view).finalizeUpdate();
    }

    @Override
    public void addView(ReactViewGroup parent, View child, int index) {
        super.addView(parent, child, index);
        if (child instanceof RPath) {
            ((RCanvasHandler) parent).finalizePathAddition((RPath) child);
        }
    }

    @Override
    public void removeViewAt(ReactViewGroup parent, int index) {
        View child = parent.getChildAt(index);
        super.removeViewAt(parent, index);
        if (child instanceof RPath) {
            ((RCanvasHandler) parent).finalizePathRemoval((RPath) child);
        }
    }

    @Override
    public void setRenderToHardwareTexture(@NonNull ReactViewGroup view, boolean useHWTexture) {
        view.setLayerType(useHWTexture ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_SOFTWARE, null);
    }

    @ReactProp(name = Props.STROKE_COLOR, customType = "Color")
    public void setStrokeColor(RCanvasHandler viewContainer, int color) {
        viewContainer.setStrokeColor(color);
    }

    @ReactProp(name = Props.STROKE_WIDTH)
    public void setStrokeWidth(RCanvasHandler viewContainer, float width) {
        viewContainer.setStrokeWidth(PixelUtil.toPixelFromDIP(width));
    }

    @Override
    public void setHitSlop(ReactViewGroup view, @Nullable ReadableMap hitSlop) {
        super.setHitSlop(view, hitSlop);
        ((RCanvasHandler) view).setHitSlop(Utility.parseHitSlop(hitSlop));
    }

    @ReactProp(name = RPathManager.Props.RESIZE_MODE)
    public void setResizeMode(RCanvasHandler view, @Nullable @ResizeMode String resizeMode) {
        view.setResizeMode(resizeMode != null ? resizeMode : RPath.ResizeMode.NONE);
    }

    @ReactProp(name = Props.DEBUG, defaultBoolean = false)
    public void setDrawDebug(RCanvasHandler view, boolean draw) {
        view.setDrawDebug(draw);
    }

    @Retention(RetentionPolicy.SOURCE)
    @IntDef({
            Commands.ALLOC,
            Commands.DRAW_POINT,
            Commands.END_INTERACTION,
            Commands.CLEAR,
            Commands.UPDATE,
            Commands.SET_PATH_ATTRIBUTES
    })
    @interface Commands {
        int ALLOC = 1;
        int DRAW_POINT = 2;
        int END_INTERACTION = 3;
        int CLEAR = 4;
        int UPDATE = 5;
        int SET_PATH_ATTRIBUTES = 6;
    }

    @Retention(RetentionPolicy.SOURCE)
    @StringDef({
            StringCommands.COMMAND_ALLOC,
            StringCommands.COMMAND_DRAW_POINT,
            StringCommands.COMMAND_END_INTERACTION,
            StringCommands.COMMAND_CLEAR,
            StringCommands.COMMAND_UPDATE,
            StringCommands.COMMAND_SET_PATH_ATTRIBUTES
    })
    @interface StringCommands {
        String COMMAND_ALLOC = "alloc";
        String COMMAND_DRAW_POINT = "drawPoint";
        String COMMAND_END_INTERACTION = "endInteraction";
        String COMMAND_CLEAR = "clear";
        String COMMAND_UPDATE = "update";
        String COMMAND_SET_PATH_ATTRIBUTES = "setAttributes";
    }

    private @Commands int resolveCommand(@StringCommands String command) {
        switch (command) {
            case StringCommands.COMMAND_ALLOC: return Commands.ALLOC;
            case StringCommands.COMMAND_DRAW_POINT: return Commands.DRAW_POINT;
            case StringCommands.COMMAND_END_INTERACTION: return Commands.END_INTERACTION;
            case StringCommands.COMMAND_CLEAR: return Commands.CLEAR;
            case StringCommands.COMMAND_UPDATE: return Commands.UPDATE;
            case StringCommands.COMMAND_SET_PATH_ATTRIBUTES: return Commands.SET_PATH_ATTRIBUTES;
            default:
                throw new JSApplicationIllegalArgumentException(
                        String.format(
                                "Unsupported command %s received by %s.",
                                command,
                                getClass().getSimpleName())
                );
        }
    }
/*
    @Override
    public void receiveCommand(ReactViewGroup root, String commandId, @Nullable ReadableArray args) {
        receiveCommand(root, resolveCommand(commandId), args);
    }
*/
    @Override
    public void receiveCommand(@NonNull ReactViewGroup root, @Commands int command, @Nullable ReadableArray args) {
        RCanvasHandler view = ((RCanvasHandler) root);
        switch (command) {
            case Commands.ALLOC: {
                int id = args.getInt(0);
                Integer strokeColor = !args.isNull(1) ? args.getInt(1) : null;
                Float strokeWidth = !args.isNull(2) ? PixelUtil.toPixelFromDIP(args.getDouble(2)) : null;
                @ResizeMode String resizeMode = args.size() == 4 && !args.isNull(3) ? args.getString(3) : null;
                view.init(id, strokeColor, strokeWidth, resizeMode);
                return;
            }
            case Commands.DRAW_POINT: {
                int id = args.getInt(0);
                float x = PixelUtil.toPixelFromDIP(args.getDouble(1));
                float y = PixelUtil.toPixelFromDIP(args.getDouble(2));
                view.drawPoint(id, new PointF(x, y));
                return;
            }
            case Commands.END_INTERACTION: {
                int id = args.getInt(0);
                view.endInteraction(id);
                return;
            }
            case Commands.CLEAR: {
                view.clear();
                return;
            }
            case Commands.UPDATE: {
                view.handleUpdate(args.getArray(0));
                return;
            }
            case Commands.SET_PATH_ATTRIBUTES: {
                int id = args.getInt(0);
                ReadableMap attributes = args.getMap(1);
                view.setAttributes(id, attributes, true);
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
                .put(StringCommands.COMMAND_ALLOC, Commands.ALLOC)
                .put(StringCommands.COMMAND_DRAW_POINT, Commands.DRAW_POINT)
                .put(StringCommands.COMMAND_END_INTERACTION, Commands.END_INTERACTION)
                .put(StringCommands.COMMAND_CLEAR, Commands.CLEAR)
                .put(StringCommands.COMMAND_UPDATE, Commands.UPDATE)
                .put(StringCommands.COMMAND_SET_PATH_ATTRIBUTES, Commands.SET_PATH_ATTRIBUTES)
                .build();

    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return RCanvasEventDispatcher.getExportedCustomDirectEventTypeConstants();
    }

}
