package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;

import java.util.ArrayList;

public class RPathState {
    ArrayList<PointF> points;
    int strokeColor;
    float strokeWidth;
    private boolean mDirty = false;
    private boolean mDirtyForCycle = false;

    RPathState(RPathState pathState) {
        this(pathState.strokeColor, pathState.strokeWidth, pathState.points);
    }

    RPathState(int strokeColor, float strokeWidth, ArrayList<PointF> points) {
        this(strokeColor, strokeWidth);
        this.points.addAll(points);
    }

    RPathState(int strokeColor, float strokeWidth) {
        this();
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }

    RPathState() {
        points = new ArrayList<>();
    }

    void setDirty() {
        mDirty = true;
        mDirtyForCycle = true;
    }

    void startListening() {
        mDirtyForCycle = false;
    }

    boolean isDirty() {
        return mDirty;
    }

    boolean updatedInCycle() {
        return mDirtyForCycle;
    }

}
