package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;

import java.util.ArrayList;

public class RPathHandler extends RPath {

    private boolean mDidChange = false;

    public RPathHandler(ReactContext context) {
        super(context);
    }

    private RCanvasHandler getCanvasHandler() {
        if (getParent() != null && getParent() instanceof RCanvasHandler) {
            return ((RCanvasHandler) getParent());
        }
        return null;
    }

    @Override
    public void setPathId(String id) {
        RCanvasHandler handler = getCanvasHandler();
        boolean changed = mPathId != null && !mPathId.equals(id);
        if (handler != null && changed) handler.finalizePathRemoval(this);
        super.setPathId(id);
        if (handler != null && changed) handler.finalizePathAddition(this);
    }

    @Override
    public void setStrokeColor(int color) {
        super.setStrokeColor(color);
        mDidChange = true;
    }

    @Override
    public void setStrokeWidth(float width) {
        super.setStrokeWidth(width);
        mDidChange = true;
    }

    @Override
    public void setPoints(@Nullable ArrayList<PointF> points) {
        super.setPoints(points);
        mDidChange = true;
    }

    void finalizeUpdate() {
        RCanvasHandler handler = getCanvasHandler();
        if (mDidChange && handler != null) {
            handler.finalizeUpdate(this);
        }
        mDidChange = false;
    }
}
