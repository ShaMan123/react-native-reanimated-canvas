package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Region;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;

public class RCanvasPath extends View {
    protected final ArrayList<PointF> mPoints;
    private String mPathId;
    private int mStrokeColor;
    private float mStrokeWidth;
    protected boolean isTranslucent;

    private Paint mPaint;
    private Path mPath;

    protected ArrayList<PointF> mTempPoints;
    private Boolean mReceivedPoints = false;
    private Boolean mShouldAnimatePath = false;

    public RCanvasPath(ReactContext context) {
        super(context);
        mPath = new Path();
        mPoints = new ArrayList<>();
        //setHardwareAcceleration(false);
    }

    public void init(String id, int strokeColor, float strokeWidth) {
        mPathId = id;
        setStrokeColor(strokeColor);
        setStrokeWidth(strokeWidth);
    }

    public void init(String id, int strokeColor, float strokeWidth, @Nullable ArrayList<PointF> points) {
        init(id, strokeColor, strokeWidth);
        setPoints(points);
    }

    public String getPathId() {
        return mPathId;
    }

    public int getStrokeColor() {
        return mStrokeColor;
    }

    public void setStrokeColor(int color) {
        mStrokeColor = color;
        boolean isErase = mStrokeColor == Color.TRANSPARENT;
        getPaint().setColor(mStrokeColor);
        getPaint().setXfermode(new PorterDuffXfermode(isErase ? PorterDuff.Mode.CLEAR : PorterDuff.Mode.SRC_OVER));
    }

    public float getStrokeWidth() {
        return  mStrokeWidth;
    }

    public void setStrokeWidth(float width) {
        mStrokeWidth = width;
        getPaint().setStrokeWidth(mStrokeWidth);
    }

    protected void setHardwareAcceleration(boolean useHardwareAcceleration) {
        Utility.setHardwareAcceleration(this, useHardwareAcceleration);
    }

    private static Boolean isTranslucent(int strokeColor) {
        return ((strokeColor >> 24) & 0xff) != 255 && strokeColor != Color.TRANSPARENT;
    }

    public static PointF midPoint(PointF p1, PointF p2) {
        return new PointF((p1.x + p2.x) * 0.5f, (p1.y + p2.y) * 0.5f);
    }

    public void addPoint(PointF p) {
        mPoints.add(p);
        int pointsCount = mPoints.size();

        if (pointsCount >= 3) {
            addPointToPath(mPath,
                    mPoints.get(pointsCount - 3),
                    mPoints.get(pointsCount - 2),
                    p);
        } else if (pointsCount >= 2) {
            addPointToPath(mPath, mPoints.get(0), mPoints.get(0), p);
        } else {
            addPointToPath(mPath, p, p, p);
        }

        postInvalidateOnAnimation();
    }

    public void setPoints(@Nullable ArrayList<PointF> points) {
        if (points != null) {
            mPoints.addAll(points);
            mPath.set(evaluatePath());
            postInvalidateOnAnimation();
        }
    }

    public void preCommitPoints(@Nullable ArrayList<PointF> points) {
        mTempPoints = points;
        if (points != null) {
            mReceivedPoints = true;
        }
    }

    private void commitPoints() {
        if (mTempPoints != null) {
            setPoints(mTempPoints);
            mTempPoints = null;
        }
    }

    public void shouldAnimatePath(Boolean animate) {
        mShouldAnimatePath = animate;
    }

    public void commitPoint(int index) {
        if (mTempPoints != null) {
            UiThreadUtil.assertOnUiThread();
            addPoint(mTempPoints.get(index));
            ((ViewGroup) getParent()).postInvalidateOnAnimation();
            if (index == mTempPoints.size() - 1) {
                mTempPoints = null;
                mShouldAnimatePath = false;
            }
        }
    }

    public void onAfterUpdateTransaction() {
        if (mReceivedPoints) {
            mReceivedPoints = false;
            if (!mShouldAnimatePath) {
                commitPoints();
            }
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        canvas.drawPath(mPath, getPaint());
        /*
        for (int i = 0; i < mPoints.size(); i++) {
            draw(canvas, i);
        }

         */
    }

    protected void drawPoint(int pointIndex) {
        int pointsCount = mPoints.size();
        if (pointIndex < 0) {
            pointIndex += pointsCount;
        }
        if (pointIndex >= pointsCount) {
            return;
        }

        if (pointsCount >= 3 && pointIndex >= 2) {
            PointF a = mPoints.get(pointIndex - 2);
            PointF b = mPoints.get(pointIndex - 1);
            PointF c = mPoints.get(pointIndex);
            PointF prevMid = midPoint(a, b);
            PointF currentMid = midPoint(b, c);

            // Draw a curve
            Path path = new Path();
            path.moveTo(prevMid.x, prevMid.y);
            path.quadTo(b.x, b.y, currentMid.x, currentMid.y);

            mPath.addPath(path);
        } else if (pointsCount >= 2 && pointIndex >= 1) {
            PointF a = mPoints.get(pointIndex - 1);
            PointF b = mPoints.get(pointIndex);
            PointF mid = midPoint(a, b);

            // Draw a line to the middle of mPoints a and b
            // This is so the next draw which uses a curve looks correct and continues from there
            //mPath.drawLine(a.x, a.y, mid.x, mid.y, getPaint());
            mPath.moveTo(a.x, a.y);
            mPath.lineTo(mid.x, mid.y);
        } else if (pointsCount >= 1) {
            PointF a = mPoints.get(pointIndex);

            // Draw a single point
            mPath.addCircle(a.x, a.y, mStrokeWidth, Path.Direction.CCW);
        }
    }

    protected void draw(Canvas canvas, int pointIndex) {
        int pointsCount = mPoints.size();
        if (pointIndex < 0) {
            pointIndex += pointsCount;
        }
        if (pointIndex >= pointsCount) {
            return;
        }

        if (pointsCount >= 3 && pointIndex >= 2) {
            PointF a = mPoints.get(pointIndex - 2);
            PointF b = mPoints.get(pointIndex - 1);
            PointF c = mPoints.get(pointIndex);
            PointF prevMid = midPoint(a, b);
            PointF currentMid = midPoint(b, c);

            // Draw a curve
            Path path = new Path();
            path.moveTo(prevMid.x, prevMid.y);
            path.quadTo(b.x, b.y, currentMid.x, currentMid.y);

            canvas.drawPath(path, getPaint());
        } else if (pointsCount >= 2 && pointIndex >= 1) {
            PointF a = mPoints.get(pointIndex - 1);
            PointF b = mPoints.get(pointIndex);
            PointF mid = midPoint(a, b);

            // Draw a line to the middle of mPoints a and b
            // This is so the next draw which uses a curve looks correct and continues from there
            canvas.drawLine(a.x, a.y, mid.x, mid.y, getPaint());
        } else if (pointsCount >= 1) {
            PointF a = mPoints.get(pointIndex);

            // Draw a single point
            canvas.drawPoint(a.x, a.y, getPaint());
        }
    }

    private Paint getPaint() {
        if (mPaint == null) {
            boolean isErase = mStrokeColor == Color.TRANSPARENT;

            mPaint = new Paint();
            mPaint.setColor(mStrokeColor);
            mPaint.setStrokeWidth(mStrokeWidth);
            mPaint.setStyle(Paint.Style.STROKE);
            mPaint.setStrokeCap(Paint.Cap.ROUND);
            mPaint.setStrokeJoin(Paint.Join.ROUND);
            mPaint.setAntiAlias(true);
            mPaint.setXfermode(new PorterDuffXfermode(isErase ? PorterDuff.Mode.CLEAR : PorterDuff.Mode.SRC_OVER));
        }
        return mPaint;
    }

    private Path evaluatePath() {
        int pointsCount = mPoints.size();
        Path path = new Path();

        for(int pointIndex=0; pointIndex<pointsCount; pointIndex++) {
            if (pointsCount >= 3 && pointIndex >= 2) {
                PointF a = mPoints.get(pointIndex - 2);
                PointF b = mPoints.get(pointIndex - 1);
                PointF c = mPoints.get(pointIndex);
                PointF prevMid = midPoint(a, b);
                PointF currentMid = midPoint(b, c);

                // Draw a curve
                path.moveTo(prevMid.x, prevMid.y);
                path.quadTo(b.x, b.y, currentMid.x, currentMid.y);
            } else if (pointsCount >= 2 && pointIndex >= 1) {
                PointF a = mPoints.get(pointIndex - 1);
                PointF b = mPoints.get(pointIndex);
                PointF mid = midPoint(a, b);

                // Draw a line to the middle of mPoints a and b
                // This is so the next draw which uses a curve looks correct and continues from there
                path.moveTo(a.x, a.y);
                path.lineTo(mid.x, mid.y);
            } else if (pointsCount >= 1) {
                PointF a = mPoints.get(pointIndex);

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

        return mTouchPath.op(path, Path.Op.INTERSECT);

        //Log.d("RNSketchCanvas", "isPointOnPath: r: " + r + ", left: " + Math.max(x - radius, 0)+ ", top: " + Math.max(y - radius, 0)+ ", right: " +Math.max(x + radius, 0)+ ", bottom: " + Math.max(y + radius, 0));
        //return !region1.quickReject(region2) && region1.op(region2, Region.Op.INTERSECT);
        //return region1.op(region2, Region.Op.INTERSECT);
    }

    public WritableMap toWritableMap() {
        return toWritableMap(true);
    }

    public WritableMap toWritableMap(Boolean includePoints){
        WritableMap path = Arguments.createMap();
        WritableArray arr = Arguments.createArray();
        path.putString("id", mPathId);
        path.putInt("color", mStrokeColor);
        path.putDouble("width", PixelUtil.toDIPFromPixel(mStrokeWidth));

        if (includePoints) {
            for(PointF point: mPoints){
                arr.pushMap(Utility.toWritablePoint(point));
            }
            path.putArray("mPoints", arr);
        }

        return path;
    }
}
