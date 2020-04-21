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

import io.autodidact.reanimatedcanvas.RPath.ResizeMode;

import static io.autodidact.reanimatedcanvas.RCanvasManager.TAG;

public class RCanvas extends ReactViewGroup {

    protected ArrayList<RPath> mPaths = new ArrayList<>();
    protected ArrayList<Integer> mInteractionContainer = new ArrayList<>();
    protected RectF mHitSlop = new RectF();
    private @ResizeMode String mResizeMode = ResizeMode.NONE;
    private RPath mNextPath;
    protected Stack<RCanvasState> mStateStack;
    private final IntersectionHelper mIntersectionHelper;

    public RCanvas(ThemedReactContext context) {
        super(context);
        mIntersectionHelper = new IntersectionHelper(this);
        mStateStack = new Stack<>();
        mStateStack.push(new RCanvasState());
        allocNext();
    }

    public IntersectionHelper getIntersectionHelper(){
        return mIntersectionHelper;
    }

    public void setDrawDebug(boolean drawDebug) {
        mIntersectionHelper.setDebug(drawDebug);
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
        for (RPath path: paths()) {
            path.save();
        }
        return mStateStack.size() - 1;
    }

    public ArrayList<RPath> restore(int saveCount) {
        if (saveCount == -1) {
            saveCount = Math.max(mStateStack.size() - 1, 0);
        } else if (saveCount >= mStateStack.size() || saveCount < 0) {
            throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s: bad save count %d", TAG, saveCount));
        }

        ArrayList<RPath> changedPaths = new ArrayList<>();
        mStateStack.set(mStateStack.size() - 1, mStateStack.get(saveCount));
        for (RPath path: paths()) {
            if (path.restore(saveCount)) {
                changedPaths.add(path);
            }
        }

        postInvalidateOnAnimation();
        return changedPaths;
    }

    public void setHitSlop(RectF hitSlop){
        mHitSlop = hitSlop;
        for (RPath path: paths()) {
            path.setHitSlop(mHitSlop);
        }
    }

    public void setResizeMode(@ResizeMode String resizeMode) {
        mResizeMode = resizeMode;
        for (RPath path: paths()) {
            path.setResizeMode(resizeMode);
        }
    }

    public ArrayList<RPath> paths() {
        return new ArrayList<>(mPaths);
    }

    public RPath getPath(int id) {
        for (RPath path: paths()) {
            if (path.getPathId() == id) {
                return path;
            }
        }

        throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s failed to find path#%d", TAG, id));
    }

    public int getPathIndex(int pathId) {
        ArrayList<RPath> paths = paths();
        for (int i = 0; i < paths.size(); i++) {
            RPath path = paths.get(i);
            if (path.getPathId() == pathId) {
                return i;
            }
        }
        return -1;
    }

    private void allocNext() {
        mNextPath = new RPath((ReactContext) getContext());
        addView(mNextPath, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        mNextPath.onSizeChanged(getWidth(), getHeight(), 0, 0);
    }

    public int init() {
        int pathId = Utility.generateId();
        init(pathId, null, null, null);
        return pathId;
    }

    public void init(int pathId, @Nullable Integer strokeColor, @Nullable Float strokeWidth,
                     @Nullable @ResizeMode String resizeMode) {
        RCanvasState currentState = mStateStack.peek();
        strokeColor = strokeColor == null ? currentState.strokeColor : strokeColor;
        strokeWidth = strokeWidth == null ? currentState.strokeWidth : strokeWidth;
        resizeMode = resizeMode == null ? mResizeMode : resizeMode;
        RPath path = init(pathId);
        path.setStrokeColor(strokeColor);
        path.setStrokeWidth(strokeWidth);
        path.setResizeMode(resizeMode);
    }

    protected RPath init(int pathId) {
        if (getPathIndex(pathId) == -1) {
            RPath path = mNextPath;
            path.setPathId(pathId);
            path.setHitSlop(mHitSlop);
            path.setResizeMode(mResizeMode);
            mPaths.add(path);
            allocNext();
            return path;
        } else {
            throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "%s: path#%s already exists", TAG, pathId));
        }
    }

    public void drawPoint(int pathId, PointF point) {
        UiThreadUtil.assertOnUiThread();
        ensureInteraction(pathId);
        getPath(pathId).addPoint(point);
        postInvalidateOnAnimation();
    }

    public void ensureInteraction(int pathId) {
        if (mInteractionContainer.indexOf(pathId) == -1) {
            mInteractionContainer.add(pathId);
        }
    }

    public void endInteraction(int pathId) {
        mInteractionContainer.remove((Integer) pathId);
    }

    public void clear() {
        removePaths(filterPaths(paths(), false));
        postInvalidateOnAnimation();
    }

    protected void removePaths(final ArrayList<RPath> paths) {
        mPaths.removeAll(paths);
        for (RPath path: paths) {
            removeView(path);
        }
    }

    protected ArrayList<RPath> filterPaths(final ArrayList<RPath> paths, final boolean pathInteractionInProgress) {
        ArrayList<RPath> filteredList = new ArrayList<>();
        for (RPath path: paths) {
            if ((mInteractionContainer.indexOf(path.getPathId()) > -1) == pathInteractionInProgress) {
                filteredList.add(path);
            }
        }
        return filteredList;
    }

    public void tearDown(){

    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        for (RPath path: paths()) {
            path.onSizeChanged(w, h, oldw, oldh);
        }
        mNextPath.onSizeChanged(w, h, oldw, oldh);
    }
}
