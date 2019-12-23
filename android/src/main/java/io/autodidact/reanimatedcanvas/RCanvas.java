package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.graphics.RectF;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;
import java.util.Locale;
import java.util.Stack;

import static io.autodidact.reanimatedcanvas.RCanvasManager.TAG;

public class RCanvas extends ReactViewGroup {

    protected ArrayList<RCanvasPath> mPaths = new ArrayList<>();

    private boolean mHardwareAccelerated = false;
    protected RectF mHitSlop = new RectF();


    private final PathIntersectionHelper mIntersectionHelper;

    private RCanvasPath mNextPath;

    protected Stack<RCanvasState> mStateStack;

    public RCanvas(ThemedReactContext context) {
        super(context);
        mIntersectionHelper = new PathIntersectionHelper(this);
        mStateStack = new Stack<>();
        mStateStack.push(new RCanvasState());
        allocNext();
    }

    public PathIntersectionHelper getIntersectionHelper(){
        return mIntersectionHelper;
    }

    public void setHardwareAcceleration(boolean useHardwareAcceleration) {
        mHardwareAccelerated = useHardwareAcceleration;
        Utility.setHardwareAcceleration(this, useHardwareAcceleration);
    }

    public void setStrokeColor(int color) {
        RCanvasState currentState = mStateStack.peek();
        currentState.strokeColor = color;
    }

    public void setStrokeWidth(float width) {
        RCanvasState currentState = mStateStack.peek();
        currentState.strokeWidth = width;
    }

    public int save() {
        mStateStack.push(mStateStack.peek());
        for (RCanvasPath path: paths()) {
            path.save();
        }
        return mStateStack.size() - 1;
    }

    public ArrayList<RCanvasPath> restore() {
        return restore(mStateStack.size() - 1);
    }

    public ArrayList<RCanvasPath> restore(int saveCount) {
        if (saveCount == -1) {
            saveCount = mStateStack.size() - 1;
        } else if (saveCount >= mStateStack.size() || saveCount < 0) {
            throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s: bad save count %d", TAG, saveCount));
        }

        ArrayList<RCanvasPath> changedPaths = new ArrayList<>();
        mStateStack.setSize(saveCount + 1);
        for (RCanvasPath path: paths()) {
            if (path.restore(saveCount)) {
                changedPaths.add(path);
            }
        }

        postInvalidateOnAnimation();
        return changedPaths;
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

    public String init() {
        RCanvasState currentState = mStateStack.peek();
        String pathId = Utility.generateId();
        init(pathId, currentState.strokeColor, currentState.strokeWidth);
        return pathId;
    }

    public void init(String pathId, @Nullable Integer strokeColor, @Nullable Float strokeWidth) {
        RCanvasState currentState = mStateStack.peek();
        strokeColor = strokeColor == null ? currentState.strokeColor : strokeColor;
        strokeWidth = strokeWidth == null ? currentState.strokeWidth : strokeWidth;
        RCanvasPath path = mNextPath;
        path.init(pathId, strokeColor, strokeWidth, mHitSlop);
        mPaths.add(path);
        allocNext();
        postInvalidateOnAnimation();
    }

    public void drawPoint(String pathId, PointF point) {
        UiThreadUtil.assertOnUiThread();
        getPath(pathId).addPoint(point);
        postInvalidateOnAnimation();
    }

    public void endInteraction(String pathId) {

    }

    public void clear() {
        removePaths(paths());
        allocNext();
        postInvalidateOnAnimation();
    }

    protected void addPath(String id) {
        if (getPathIndex(id) == -1) {
            allocNext();
            mNextPath.setPathId(id);
            mNextPath.setHitSlop(mHitSlop);
        } else {
            throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s: path#%s already exists", TAG, id));
        }
    }

    protected void removePaths(final ArrayList<RCanvasPath> paths) {
        mPaths.removeAll(paths);
        for (RCanvasPath path: paths) {
            removeView(path);
        }
    }

    public void tearDown(){

    }
}
