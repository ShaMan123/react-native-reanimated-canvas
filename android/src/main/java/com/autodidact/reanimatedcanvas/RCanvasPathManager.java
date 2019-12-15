package com.autodidact.reanimatedcanvas;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class RCanvasPathManager extends SimpleViewManager<RCanvasPath> {
    private final static String NAME = "ReanimatedCanvasPathManager";
    private final static String PROPS_POINTS = "points";
    private final static String PROPS_ANIMATE = "animate";
    private final static String PROPS_ANIMATION_CONTROLLER = "index";

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

    @ReactProp(name = RCanvasManager.PROPS_HARDWARE_ACCELERATED)
    public void setHardwareAccelerated(RCanvasPath view, boolean useAcceleration) {
        view.setHardwareAcceleration(useAcceleration);
    }

    @ReactProp(name = RCanvasManager.PROPS_STROKE_COLOR)
    public void setStrokeColor(RCanvasPath view, int color) {
        view.setStrokeColor(color);
    }

    @ReactProp(name = RCanvasManager.PROPS_STROKE_WIDTH)
    public void setStrokeWidth(RCanvasPath view, float width) {
        view.setStrokeWidth(PixelUtil.toPixelFromDIP(width));
    }

    @ReactProp(name = PROPS_POINTS)
    public void setPoints(RCanvasPath view, ReadableArray points) {
        view.preCommitPoints(Utility.processPointArray(points));
    }

    @ReactProp(name = PROPS_ANIMATE)
    public void setShouldAnimatePath(RCanvasPath view, Boolean animate) {
        view.shouldAnimatePath(animate);
    }

    @ReactProp(name = PROPS_ANIMATION_CONTROLLER)
    public void setPathAnimationController(RCanvasPath view, int index) {
        view.commitPoint(index);
    }

    @Override
    protected void onAfterUpdateTransaction(@NonNull RCanvasPath view) {
        super.onAfterUpdateTransaction(view);
        view.onAfterUpdateTransaction();
    }
}
