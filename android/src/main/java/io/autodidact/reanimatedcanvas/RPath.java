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
import android.view.View;

import androidx.annotation.Nullable;
import androidx.annotation.StringDef;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Stack;

public class RPath extends View {
    protected Stack<RPathState> mPathStateStack;
    protected int mPathId = 0;
    private RectF mHitSlop;
    private boolean mOverriddenHitSlop = false;
    private @RPath.ResizeMode String mResizeMode = RPath.ResizeMode.NONE;

    private Paint mPaint;
    protected Path mPath;

    protected ArrayList<PointF> mTempPoints;

    public RPath(ReactContext context) {
        super(context);
        mPath = new Path();
        mPathStateStack = new Stack<>();
        mPathStateStack.push(new RPathState());
        mHitSlop = new RectF();
    }

    public int getPathId() {
        return mPathId;
    }

    public void setPathId(int id) {
        mPathId = id;
    }

    public RPathState getState() {
        return mPathStateStack.peek();
    }

    public int getStrokeColor() {
        return mPathStateStack.peek().strokeColor;
    }

    public void setStrokeColor(int color) {
        RPathState currentState = mPathStateStack.peek();
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
        RPathState currentState = mPathStateStack.peek();
        currentState.strokeWidth = width;
        currentState.setDirty();
        getPaint().setStrokeWidth(currentState.strokeWidth);

        postInvalidateOnAnimation();
    }

    /**
     * save and restore are managed by parent RCanvas
     */
    public int save() {
        mPathStateStack.push(new RPathState(mPathStateStack.peek()));
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

        for (int i = mPathStateStack.size() - 1; i >= saveCount ; i--) {
            if (mPathStateStack.get(i).isDirty()) {
                isDirty = true;
                break;
            }
        }

        mPathStateStack.set(mPathStateStack.size() - 1, mPathStateStack.get(saveCount));

        return isDirty;
    }

    RectF getHitSlop() {
        float radius = getStrokeWidth() / 2;
        return new RectF(
            mHitSlop.left + radius,
            mHitSlop.top + radius,
            mHitSlop.right + radius,
            mHitSlop.bottom + radius
        );
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

    public void setResizeMode(@ResizeMode String resizeMode) {
        mResizeMode = resizeMode;
    }

    private static boolean isTranslucent(int strokeColor) {
        return ((strokeColor >> 24) & 0xff) != 255 && strokeColor != Color.TRANSPARENT;
    }

    public void addPoint(PointF p) {
        RPathState currentState = mPathStateStack.peek();
        ArrayList<PointF> points = currentState.points;
        points.add(p);
        currentState.setDirty();
        PathUtil.addLastPoint(mPath, points);

        postInvalidateOnAnimation();
    }

    public void setPoints(@Nullable ArrayList<PointF> points) {
        if (points != null) {
            RPathState currentState = mPathStateStack.peek();
            ArrayList<PointF> mPoints = currentState.points;
            mPoints.clear();
            mPoints.addAll(points);
            currentState.setDirty();
            mPath.set(PathUtil.obtain(mPoints));

            postInvalidateOnAnimation();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.drawPath(mPath, getPaint());
    }

    protected Paint getPaint() {
        if (mPaint == null) {
            RPathState currentsState = mPathStateStack.peek();
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

    @TargetApi(19)
    boolean isPointOnPath(final PointF point) {
        if (mPathStateStack.peek().points.size() == 0) {
            return false;
        }
        return IntersectionHelper
                .IntersectionOperator
                .intersectsPath(point, getHitSlop(), mPath);
    }

    public WritableMap toWritableMap(boolean includePoints){
        WritableMap path = Arguments.createMap();
        WritableArray arr = Arguments.createArray();
        RPathState currentState = mPathStateStack.peek();
        path.putInt("id", mPathId);
        path.putString("strokeColor", Utility.parseColorForJS(currentState.strokeColor));
        path.putDouble("strokeWidth", PixelUtil.toDIPFromPixel(currentState.strokeWidth));

        if (includePoints) {
            for(PointF point: currentState.points){
                arr.pushMap(Utility.toWritablePoint(point));
            }
            path.putArray("points", arr);
        }

        return path;
    }

    @Retention(RetentionPolicy.SOURCE)
    @StringDef({
            ResizeMode.COVER,
            ResizeMode.STRETCH,
            ResizeMode.NONE
    })
    @interface ResizeMode {
        String COVER = "cover";
        String STRETCH = "stretch";
        String NONE = "none";
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        PointF scaler;
        float sx = w * 1.f / oldw * 1.f;
        float sy = h * 1.f / oldh * 1.f;
        float scale = sx;
        PointF next;
        switch (mResizeMode) {
            case ResizeMode.COVER:
                next = new PointF(Math.max(oldw * scale, w), Math.max(oldh * scale, h));
                scale = Math.min(next.x / oldw, next.y / oldh);
                scaler = new PointF(scale, scale);
                break;
            case ResizeMode.STRETCH:
                scaler = new PointF(sx, sy);
                break;
            default:
            case ResizeMode.NONE:
                return;
        }
        ArrayList<PointF> points = new ArrayList<>(mPathStateStack.peek().points);
        for (PointF point: points) {
            point.x *= scaler.x;
            point.y *= scaler.y;
        }
        setPoints(points);
    }

    @Override
    public String toString() {
        HashMap<String, Object> props = new HashMap<>();
        RPathState currentState = mPathStateStack.peek();
        props.put("id", mPathId);
        props.put("strokeColor", Utility.parseColorForJS(currentState.strokeColor));
        props.put("strokeWidth", currentState.strokeWidth);
        props.put("nativeStrokeWidth", PixelUtil.toDIPFromPixel(currentState.strokeWidth));
        props.put("points", currentState.points);
        return String.format(Locale.ENGLISH, "RPath(%s)", props);
    }

}
