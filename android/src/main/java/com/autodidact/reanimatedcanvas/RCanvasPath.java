package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Region;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;

import java.util.ArrayList;

public class RCanvasPath {
    protected final ArrayList<PointF> points = new ArrayList<>();
    protected final String id;
    protected int strokeColor;
    protected float strokeWidth;
    protected boolean isTranslucent;

    private Paint mPaint;
    private Path mPath;

    public RCanvasPath(String id, int strokeColor, float strokeWidth) {
        this(id, strokeColor, strokeWidth, null);
    }

    public RCanvasPath(String id, int strokeColor, float strokeWidth, @Nullable ArrayList<PointF> points) {
        this.id = id;
        this.strokeColor = strokeColor;
        this.isTranslucent = isTranslucent(strokeColor);
        this.strokeWidth = strokeWidth;

        mPath = new Path();
        if (points != null) {
            this.points.addAll(points);
            mPath.set(evaluatePath());
        }
    }

    private static Boolean isTranslucent(int strokeColor) {
        return ((strokeColor >> 24) & 0xff) != 255 && strokeColor != Color.TRANSPARENT;
    }

    public static PointF midPoint(PointF p1, PointF p2) {
        return new PointF((p1.x + p2.x) * 0.5f, (p1.y + p2.y) * 0.5f);
    }

    public void addPoint(PointF p) {
        points.add(p);
        int pointsCount = points.size();

        if (pointsCount >= 3) {
            addPointToPath(mPath,
                    this.points.get(pointsCount - 3),
                    this.points.get(pointsCount - 2),
                    p);
        } else if (pointsCount >= 2) {
            addPointToPath(mPath, this.points.get(0), this.points.get(0), p);
        } else {
            addPointToPath(mPath, p, p, p);
        }
    }


    public void draw(Canvas canvas) {
        canvas.drawPath(mPath, getPaint());
    }

    protected void drawPoint(int pointIndex) {
        int pointsCount = points.size();
        if (pointIndex < 0) {
            pointIndex += pointsCount;
        }
        if (pointIndex >= pointsCount) {
            return;
        }

        if (pointsCount >= 3 && pointIndex >= 2) {
            PointF a = points.get(pointIndex - 2);
            PointF b = points.get(pointIndex - 1);
            PointF c = points.get(pointIndex);
            PointF prevMid = midPoint(a, b);
            PointF currentMid = midPoint(b, c);

            // Draw a curve
            Path path = new Path();
            path.moveTo(prevMid.x, prevMid.y);
            path.quadTo(b.x, b.y, currentMid.x, currentMid.y);

            mPath.addPath(path);
        } else if (pointsCount >= 2 && pointIndex >= 1) {
            PointF a = points.get(pointIndex - 1);
            PointF b = points.get(pointIndex);
            PointF mid = midPoint(a, b);

            // Draw a line to the middle of points a and b
            // This is so the next draw which uses a curve looks correct and continues from there
            //mPath.drawLine(a.x, a.y, mid.x, mid.y, getPaint());
            mPath.moveTo(a.x, a.y);
            mPath.lineTo(mid.x, mid.y);
        } else if (pointsCount >= 1) {
            PointF a = points.get(pointIndex);

            // Draw a single point
            mPath.addCircle(a.x, a.y, strokeWidth, Path.Direction.CCW);
        }
    }

    protected void draw(Canvas canvas, int pointIndex) {
        int pointsCount = points.size();
        if (pointIndex < 0) {
            pointIndex += pointsCount;
        }
        if (pointIndex >= pointsCount) {
            return;
        }

        if (pointsCount >= 3 && pointIndex >= 2) {
            PointF a = points.get(pointIndex - 2);
            PointF b = points.get(pointIndex - 1);
            PointF c = points.get(pointIndex);
            PointF prevMid = midPoint(a, b);
            PointF currentMid = midPoint(b, c);

            // Draw a curve
            Path path = new Path();
            path.moveTo(prevMid.x, prevMid.y);
            path.quadTo(b.x, b.y, currentMid.x, currentMid.y);

            canvas.drawPath(path, getPaint());
        } else if (pointsCount >= 2 && pointIndex >= 1) {
            PointF a = points.get(pointIndex - 1);
            PointF b = points.get(pointIndex);
            PointF mid = midPoint(a, b);

            // Draw a line to the middle of points a and b
            // This is so the next draw which uses a curve looks correct and continues from there
            canvas.drawLine(a.x, a.y, mid.x, mid.y, getPaint());
        } else if (pointsCount >= 1) {
            PointF a = points.get(pointIndex);

            // Draw a single point
            canvas.drawPoint(a.x, a.y, getPaint());
        }
    }

    private Paint getPaint() {
        if (mPaint == null) {
            boolean isErase = strokeColor == Color.TRANSPARENT;

            mPaint = new Paint();
            mPaint.setColor(strokeColor);
            mPaint.setStrokeWidth(strokeWidth);
            mPaint.setStyle(Paint.Style.STROKE);
            mPaint.setStrokeCap(Paint.Cap.ROUND);
            mPaint.setStrokeJoin(Paint.Join.ROUND);
            mPaint.setAntiAlias(true);
            mPaint.setXfermode(new PorterDuffXfermode(isErase ? PorterDuff.Mode.CLEAR : PorterDuff.Mode.SRC_OVER));
        }
        return mPaint;
    }

    private Path evaluatePath() {
        int pointsCount = points.size();
        Path path = new Path();

        for(int pointIndex=0; pointIndex<pointsCount; pointIndex++) {
            if (pointsCount >= 3 && pointIndex >= 2) {
                PointF a = points.get(pointIndex - 2);
                PointF b = points.get(pointIndex - 1);
                PointF c = points.get(pointIndex);
                PointF prevMid = midPoint(a, b);
                PointF currentMid = midPoint(b, c);

                // Draw a curve
                path.moveTo(prevMid.x, prevMid.y);
                path.quadTo(b.x, b.y, currentMid.x, currentMid.y);
            } else if (pointsCount >= 2 && pointIndex >= 1) {
                PointF a = points.get(pointIndex - 1);
                PointF b = points.get(pointIndex);
                PointF mid = midPoint(a, b);

                // Draw a line to the middle of points a and b
                // This is so the next draw which uses a curve looks correct and continues from there
                path.moveTo(a.x, a.y);
                path.lineTo(mid.x, mid.y);
            } else if (pointsCount >= 1) {
                PointF a = points.get(pointIndex);

                // Draw a single point
                path.moveTo(a.x, a.y);
                path.lineTo(a.x, a.y);
            }
        }
        return path;
    }

    private void addPointToPath(Path path, PointF tPoint, PointF pPoint, PointF point) {
        PointF mid1 = new PointF((pPoint.x + tPoint.x) * 0.5f, (pPoint.y + tPoint.y) * 0.5f);
        PointF mid2 = new PointF((point.x + pPoint.x) * 0.5f, (point.y + pPoint.y) * 0.5f);
        path.moveTo(mid1.x, mid1.y);
        path.quadTo(pPoint.x, pPoint.y, mid2.x, mid2.y);
    }

    //  see: https://stackoverflow.com/questions/11184397/path-intersection-in-android
    @TargetApi(19)
    boolean isPointOnPath(float x, float y, float r, Region boundingRegion) {
        float radius = r;       //Math.max((int)(strokeWidth * 0.5), r);
        Path path = mPath == null ? evaluatePath(): mPath;
        Path mTouchPath = new Path();
        mTouchPath.addCircle(x, y, radius, Path.Direction.CW);

        Region region1 = new Region();
        region1.setPath(mTouchPath, new Region((int)(Math.max(x - radius, 0)), (int)(Math.max(y - radius, 0)), (int)(Math.max(x + radius, 0)), (int)(Math.max(y + radius, 0))));
        Region region2 = new Region();
        region2.setPath(path, boundingRegion);

        //Log.d("RNSketchCanvas", "isPointOnPath: r: " + r + ", left: " + Math.max(x - radius, 0)+ ", top: " + Math.max(y - radius, 0)+ ", right: " +Math.max(x + radius, 0)+ ", bottom: " + Math.max(y + radius, 0));
        //return !region1.quickReject(region2) && region1.op(region2, Region.Op.INTERSECT);
        return region1.op(region2, Region.Op.INTERSECT);
    }

    public WritableMap toWritableMap() {
        return toWritableMap(true);
    }

    public WritableMap toWritableMap(Boolean includePoints){
        WritableMap path = Arguments.createMap();
        WritableArray arr = Arguments.createArray();
        path.putString("id", id);
        path.putInt("color", strokeColor);
        path.putDouble("width", PixelUtil.toDIPFromPixel(strokeWidth));

        if (includePoints) {
            for(PointF point: points){
                arr.pushMap(Utility.toWritablePoint(point));
            }
            path.putArray("points", arr);
        }

        return path;
    }
}
