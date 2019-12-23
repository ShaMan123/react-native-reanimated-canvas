package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;

import java.util.ArrayList;

public class RCanvasPathState {
    ArrayList<PointF> points;
    int strokeColor;
    float strokeWidth;
    private boolean mDirty = false;
    private boolean mDirtyForCycle = false;

    RCanvasPathState(RCanvasPathState pathState) {
        this(pathState.strokeColor, pathState.strokeWidth, pathState.points);
    }

    RCanvasPathState(int strokeColor, float strokeWidth, ArrayList<PointF> points) {
        this(strokeColor, strokeWidth);
        this.points.addAll(points);
    }

    RCanvasPathState(int strokeColor, float strokeWidth) {
        this();
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }

    RCanvasPathState() {
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
