package io.autodidact.reanimatedcanvas;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class RCanvasPathManager extends SimpleViewManager<RCanvasPath> {
    final static String NAME = "ReanimatedCanvasPathManager";

    @interface Props {
        String ID = "id";
        String POINTS = "points";
        String ANIMATE = "animate";
        String ANIMATION_CONTROLLER = "index";
    }

    public RCanvasPathManager() {
        super();
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @NonNull
    @Override
    protected RCanvasPath createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new RCanvasPath(reactContext);
    }

    @ReactProp(name = Props.ID)
    public void setPathId(RCanvasPath view, String id) {
        view.setPathId(id);
    }

    @ReactProp(name = RCanvasManager.Props.HARDWARE_ACCELERATED)
    public void setHardwareAccelerated(RCanvasPath view, boolean useAcceleration) {
        view.setHardwareAcceleration(useAcceleration);
    }

    @ReactProp(name = RCanvasManager.Props.STROKE_COLOR)
    public void setStrokeColor(RCanvasPath view, int color) {
        view.setStrokeColor(color);
    }

    @ReactProp(name = RCanvasManager.Props.STROKE_WIDTH)
    public void setStrokeWidth(RCanvasPath view, float width) {
        view.setStrokeWidth(PixelUtil.toPixelFromDIP(width));
    }

    @ReactProp(name = Props.POINTS)
    public void setPoints(RCanvasPath view, ReadableArray points) {
        view.preCommitPoints(Utility.processPointArray(points));
    }

    @ReactProp(name = Props.ANIMATE)
    public void setShouldAnimatePath(RCanvasPath view, Boolean animate) {
        view.shouldAnimatePath(animate);
    }

    @ReactProp(name = Props.ANIMATION_CONTROLLER)
    public void setPathAnimationController(RCanvasPath view, int index) {
        view.commitPoint(index);
    }

    @ReactProp(name = RCanvasManager.Props.HIT_SLOP)
    public void setHitSlop(RCanvasPath view, @Nullable ReadableMap hitSlop) {
        view.setHitSlop(Utility.parseHitSlop(hitSlop), true);
    }

    @Override
    protected void onAfterUpdateTransaction(@NonNull RCanvasPath view) {
        super.onAfterUpdateTransaction(view);
        view.onAfterUpdateTransaction();
        if (view.getParent() != null && view.getParent() instanceof RCanvasHandler) {
            ((RCanvasHandler) view.getParent()).finalizeUpdate(view);
        }
    }
}
