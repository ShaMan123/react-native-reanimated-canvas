package com.autodidact.reanimatedcanvas;

import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.Rect;

public class RCanvasText {
    public String text;
    public Paint paint;
    public PointF anchor, position, drawPosition, lineOffset;
    public boolean isAbsoluteCoordinate;
    public Rect textBounds;
    public float height;
}
