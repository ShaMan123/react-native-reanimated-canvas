package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.graphics.RectF;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;
import java.util.Locale;
import java.util.Stack;

import static io.autodidact.reanimatedcanvas.RCanvasManager.TAG;

public class RCanvas extends ReactViewGroup {

    private ArrayList<RCanvasPath> mPaths = new ArrayList<>();

    private boolean mHardwareAccelerated = false;
    protected RectF mHitSlop = new RectF();

    private final RCanvasEventHandler eventHandler;
    private final PathIntersectionHelper mIntersectionHelper;

    private RCanvasPath mNextPath;

    private boolean mChangedChildren = false;

    protected Stack<CanvasState> mStateStack;

    static class CanvasState {
        int strokeColor;
        float strokeWidth;

        CanvasState(int strokeColor, float strokeWidth) {
            this();
            this.strokeColor = strokeColor;
            this.strokeWidth = strokeWidth;
        }

        CanvasState() {}
    }

    public RCanvas(ThemedReactContext context) {
        super(context);
        eventHandler = new RCanvasEventHandler(this);
        mIntersectionHelper = new PathIntersectionHelper(this);
        mStateStack = new Stack<>();
        mStateStack.push(new CanvasState());
        allocNext();
    }

    public RCanvasEventHandler getEventHandler(){
        return eventHandler;
    }

    public PathIntersectionHelper getIntersectionHelper(){
        return mIntersectionHelper;
    }

    public void setHardwareAcceleration(boolean useHardwareAcceleration) {
        mHardwareAccelerated = useHardwareAcceleration;
        Utility.setHardwareAcceleration(this, useHardwareAcceleration);
    }

    public void setStrokeColor(int color) {
        CanvasState currentState = mStateStack.peek();
        currentState.strokeColor = color;
    }

    public void setStrokeWidth(float width) {
        CanvasState currentState = mStateStack.peek();
        currentState.strokeWidth = width;
    }

    public int save() {
        mStateStack.push(mStateStack.peek());
        for (RCanvasPath path: paths()) {
            path.save();
        }
        return mStateStack.size() - 1;
    }

    public void restore() {
        restore(mStateStack.size() - 1);
    }

    public void restore(int saveCount) {
        if (saveCount == -1) {
            saveCount = mStateStack.size() - 1;
        } else if (saveCount >= mStateStack.size() || saveCount < 0) {
            throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s: bad save count %d", TAG, saveCount));
        }

        mStateStack.setSize(saveCount);
        for (RCanvasPath path: paths()) {
            path.restore(saveCount);
        }

        postInvalidateOnAnimation();
        eventHandler.emitUpdate();
    }

    public void setHitSlop(RectF hitSlop){
        mHitSlop = hitSlop;
        for (RCanvasPath path: paths()) {
            path.setHitSlop(mHitSlop);
        }
    }

    public RCanvasPath getPath(String id) {
        for (RCanvasPath path: paths()) {
            if (path.getPathId() != null && path.getPathId().equals(id)) {
                return path;
            }
        }

        throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s failed to find path#%s", TAG, id));
    }

    public int getPathIndex(String pathId) {
        ArrayList<RCanvasPath> paths = paths();
        RCanvasPath path;
        for (int i = 0; i < paths.size(); i++) {
            path = paths.get(i);
            if(path.getPathId() != null && path.getPathId().equals(pathId)) {
                return i;
            }
        }
        return -1;
    }

    public ArrayList<RCanvasPath> paths() {
        return new ArrayList<>(mPaths);
    }

    private void allocNext() {
        mNextPath = new RCanvasPath((ReactContext) getContext());
        addView(mNextPath, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    }

    public void init(String pathId, @Nullable Integer strokeColor, @Nullable Float strokeWidth) {
        CanvasState currentState = mStateStack.peek();
        strokeColor = strokeColor == null ? currentState.strokeColor : strokeColor;
        strokeWidth = strokeWidth == null ? currentState.strokeWidth : strokeWidth;
        mNextPath.init(pathId, strokeColor, strokeWidth, mHitSlop);
        mPaths.add(mNextPath);
        Log.d(TAG, "init: " + mPaths.size() + " " + mPaths.get(mPaths.size() - 1).getPathId() + "  " + getPath(pathId));
        Log.d(TAG, "init2: " +getPath(pathId).getPathId());
        allocNext();
        postInvalidateOnAnimation();
        eventHandler.emitStrokeStart(pathId);
    }

    public String init() {
        CanvasState currentState = mStateStack.peek();
        String pathId = Utility.generateId();
        init(pathId, currentState.strokeColor, currentState.strokeWidth);
        return pathId;
    }

    public void drawPoint(String pathId, PointF point) {
        UiThreadUtil.assertOnUiThread();
        getPath(pathId).addPoint(point);
        postInvalidateOnAnimation();
        eventHandler.maybeEmitStrokeChange(pathId, point);
    }

    public void endInteraction(String pathId) {
        UiThreadUtil.assertOnUiThread();
        eventHandler.emitStrokeEnd(pathId);
    }

    public void clear() {
        ArrayList<RCanvasPath> paths = paths();
        for (RCanvasPath path: paths) {
            removeView(path);
        }
        mPaths.clear();
        allocNext();
        postInvalidateOnAnimation();
        eventHandler.emitPathsChange();
    }

    private void addPath(String id, int strokeColor, float strokeWidth, ArrayList<PointF> points) {
        if (getPathIndex(id) == -1) {
            allocNext();
            mNextPath.init(id, strokeColor, strokeWidth, mHitSlop, points);
        } else {
            throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s: path#%s already exists", TAG, id));
        }
    }

    public void addPaths(@Nullable ReadableArray paths){
        for (int k = 0; k < paths.size(); k++){
            ReadableArray path = paths.getArray(k);
            addPath(
                    path.getString(0),
                    path.getInt(1),
                    PixelUtil.toPixelFromDIP(path.getInt(2)),
                    Utility.processPointArray(path.getArray(3))
            );
        }

        postInvalidateOnAnimation();
        eventHandler.emitPathsChange();
    }

    public void removePaths(String[] arr) {
        for (String id: arr) {
            for (RCanvasPath path: paths()) {
                if (id.equals(path.getPathId())) {
                    removeView(path);
                    mPaths.remove(path);
                }
            }
        }

        postInvalidateOnAnimation();
        eventHandler.emitPathsChange();
    }

    public void removePaths(ReadableArray array) {
        String[] arr = new String[array.size()];
        for (int i = 0; i < array.size(); i++) {
            arr[i] = array.getString(i);
        }
        removePaths(arr);
    }

    public void setAttributes(String id, ReadableMap attributes) {
        RCanvasPath path = getPath(id);
        if (attributes.hasKey("strokeColor")) {
            path.setStrokeColor(attributes.getInt("strokeColor"));
        }
        if (attributes.hasKey("strokeWidth")) {
            path.setStrokeWidth(PixelUtil.toPixelFromDIP(attributes.getInt("strokeWidth")));
        }

        path.postInvalidateOnAnimation();
        postInvalidateOnAnimation();
    }

    @Override
    public void onViewAdded(View child) {
        super.onViewAdded(child);
        if (child instanceof RCanvasPath && mPaths.indexOf(child) == -1) {
            RCanvasPath path = (RCanvasPath) child;
            mPaths.add(path);
            path.setHitSlop(mHitSlop);
            mChangedChildren = true;
        }
    }

    @Override
    public void onViewRemoved(View child) {
        super.onViewRemoved(child);
        if (child instanceof RCanvasPath && mPaths.indexOf(child) == -1) {
            mPaths.remove(child);
            mChangedChildren = true;
        }
    }

    protected void finalizeUpdate() {
        if (mChangedChildren) {
            mChangedChildren = false;
            eventHandler.emitPathsChange();
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return eventHandler.onTouchEvent(event);
    }

    public void tearDown(){

    }
}
