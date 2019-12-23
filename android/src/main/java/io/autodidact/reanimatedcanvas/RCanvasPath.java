package io.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Stack;

public class RCanvasPath extends View {
    protected Stack<RCanvasPathState> mPathStateStack;
    protected String mPathId;
    private RectF mHitSlop;
    private boolean mOverriddenHitSlop = false;

    private Paint mPaint;
    protected Path mPath;

    protected ArrayList<PointF> mTempPoints;


    public RCanvasPath(ReactContext context) {
        super(context);
        mPath = new Path();
        mPathStateStack = new Stack<>();
        mPathStateStack.push(new RCanvasPathState());
        mHitSlop = new RectF();
        //setHardwareAcceleration(false);
    }

    public String getPathId() {
        return mPathId;
    }

    public void setPathId(String id) {
        mPathId = id;
    }

    public RCanvasPathState getState() {
        return mPathStateStack.peek();
    }

    public int getStrokeColor() {
        return mPathStateStack.peek().strokeColor;
    }

    public void setStrokeColor(int color) {
        RCanvasPathState currentState = mPathStateStack.peek();
        currentState.strokeColor = color;
        currentState.setDirty();
        boolean isErase = currentState.strokeColor == Color.TRANSPARENT;
        Paint paint = getPaint();
        paint.setColor(currentState.strokeColor);
        paint.setXfermode(new PorterDuffXfermode(isErase ? PorterDuff.Mode.CLEAR : PorterDuff.Mode.SRC_OVER));
        postInvalidateOnAnimation();
    }

    public float getStrokeWidth() {
        return mPathStateStack.peek().strokeWidth;
    }

    public void setStrokeWidth(float width) {
        RCanvasPathState currentState = mPathStateStack.peek();
        currentState.strokeWidth = width;
        currentState.setDirty();
        getPaint().setStrokeWidth(currentState.strokeWidth);
        postInvalidateOnAnimation();
    }

    /**
     * save and restore are managed by parent RCanvas
     */
    public int save() {
        mPathStateStack.push(new RCanvasPathState(mPathStateStack.peek()));
        return mPathStateStack.size() - 1;
    }

    public void restore() {
        restore(mPathStateStack.size() - 1);
    }

    /**
     * save and restore are managed by parent RCanvas
     */
    public boolean restore(int saveCount) {
        boolean isDirty = false;
        while (mPathStateStack.size() > saveCount + 1) {
            if (mPathStateStack.pop().isDirty()) {
                isDirty = true;
                break;
            }
        }
        mPathStateStack.setSize(saveCount + 1);
        postInvalidateOnAnimation();
        return isDirty;
    }

    protected void setHardwareAcceleration(boolean useHardwareAcceleration) {
        Utility.setHardwareAcceleration(this, useHardwareAcceleration);
    }

    void setHitSlop(RectF hitSlop){
        setHitSlop(hitSlop, false);
    }

    void setHitSlop(RectF hitSlop, boolean override) {
        if (override || !mOverriddenHitSlop) {
            mHitSlop = hitSlop;
        }
        if (override) {
            mOverriddenHitSlop = true;
        }
    }

    private static boolean isTranslucent(int strokeColor) {
        return ((strokeColor >> 24) & 0xff) != 255 && strokeColor != Color.TRANSPARENT;
    }

    public static PointF midPoint(PointF p1, PointF p2) {
        return new PointF((p1.x + p2.x) * 0.5f, (p1.y + p2.y) * 0.5f);
    }

    public void addPoint(PointF p) {
        RCanvasPathState currentState = mPathStateStack.peek();
        ArrayList<PointF> points = currentState.points;
        points.add(p);
        currentState.setDirty();
        int pointsCount = points.size();

        if (pointsCount >= 3) {
            addPointToPath(mPath,
                    points.get(pointsCount - 3),
                    points.get(pointsCount - 2),
                    p);
        } else if (pointsCount >= 2) {
            addPointToPath(mPath, points.get(0), points.get(0), p);
        } else {
            addPointToPath(mPath, p, p, p);
        }

        postInvalidateOnAnimation();
    }

    public void setPoints(@Nullable ArrayList<PointF> points) {
        if (points != null) {
            RCanvasPathState currentState = mPathStateStack.peek();
            ArrayList<PointF> mPoints = currentState.points;
            mPoints.clear();
            mPoints.addAll(points);
            currentState.setDirty();

            mPath.set(evaluatePath());
            postInvalidateOnAnimation();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        canvas.drawPath(mPath, getPaint());

    }

    protected Paint getPaint() {
        if (mPaint == null) {
            RCanvasPathState currentsState = mPathStateStack.peek();
            boolean isErase = currentsState.strokeColor == Color.TRANSPARENT;
            mPaint = new Paint();
            mPaint.setColor(currentsState.strokeColor);
            mPaint.setStrokeWidth(currentsState.strokeWidth);
            mPaint.setStyle(Paint.Style.STROKE);
            mPaint.setStrokeCap(Paint.Cap.ROUND);
            mPaint.setStrokeJoin(Paint.Join.ROUND);
            mPaint.setAntiAlias(true);
            mPaint.setXfermode(new PorterDuffXfermode(isErase ? PorterDuff.Mode.CLEAR : PorterDuff.Mode.SRC_OVER));
        }
        return mPaint;
    }

    private Path evaluatePath() {
        RCanvasPathState currentState = mPathStateStack.peek();
        ArrayList<PointF> points = currentState.points;
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

    private static void addPointToPath(Path path, PointF tPoint, PointF pPoint, PointF point) {
        PointF mid1 = new PointF((pPoint.x + tPoint.x) * 0.5f, (pPoint.y + tPoint.y) * 0.5f);
        PointF mid2 = new PointF((point.x + pPoint.x) * 0.5f, (point.y + pPoint.y) * 0.5f);
        path.moveTo(mid1.x, mid1.y);
        path.quadTo(pPoint.x, pPoint.y, mid2.x, mid2.y);
    }

    @TargetApi(19)
    boolean isPointOnPath(final PointF point) {
        if (mPathStateStack.peek().points.size() == 0) {
            return false;
        }
        return PathIntersectionHelper
                .IntersectionOperator
                .intersectsPath(point, mHitSlop, mPath);
    }

    public WritableMap toWritableMap(Boolean includePoints){
        WritableMap path = Arguments.createMap();
        WritableArray arr = Arguments.createArray();
        RCanvasPathState currentState = mPathStateStack.peek();
        path.putString("id", mPathId);
        path.putInt("strokeColor", currentState.strokeColor);
        path.putDouble("strokeWidth", PixelUtil.toDIPFromPixel(currentState.strokeWidth));

        if (includePoints) {
            for(PointF point: currentState.points){
                arr.pushMap(Utility.toWritablePoint(point));
            }
            path.putArray("points", arr);
        }

        return path;
    }

    @Override
    public String toString() {
        HashMap<String, Object> props = new HashMap<>();
        RCanvasPathState currentState = mPathStateStack.peek();
        props.put("id", mPathId);
        props.put("strokeColor", currentState.strokeColor);
        props.put("strokeWidth", currentState.strokeWidth);
        props.put("nativeStrokeWidth", PixelUtil.toDIPFromPixel(currentState.strokeWidth));
        props.put("points", currentState.points);
        return String.format(Locale.ENGLISH, "RCanvasPath(%s)", props);
    }
}
