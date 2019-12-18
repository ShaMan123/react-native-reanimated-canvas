package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.graphics.RectF;
import android.view.MotionEvent;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;

public class RCanvas extends ReactViewGroup {

    private ArrayList<RCanvasPath> mPaths = new ArrayList<RCanvasPath>();
    private RCanvasPath mCurrentPath = null;

    private boolean mHardwareAccelerated = false;
    private int mStrokeColor;
    private float mStrokeWidth;
    protected RectF mHitSlop = new RectF();

    private final RCanvasEventHandler eventHandler;
    private final PathIntersectionHelper mIntersectionHelper;

    private RCanvasPath mNextPath;

    private boolean mChangedChildren = false;

    public RCanvas(ThemedReactContext context) {
        super(context);
        eventHandler = new RCanvasEventHandler(this);
        mIntersectionHelper = new PathIntersectionHelper(this);
        prepareNextPath();
    }

    public RCanvasEventHandler getEventHandler(){
        return eventHandler;
    }
    public PathIntersectionHelper getIntersectionHelper(){
        return mIntersectionHelper;
    }

    private void prepareNextPath() { prepareNextPath(false); }

    private void prepareNextPath(Boolean invalidate) {
        mNextPath = new RCanvasPath(((ReactContext) getContext()));
        addView(mNextPath, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        if (invalidate) {
            postInvalidateOnAnimation();
        }
    }

    protected void addPath(RCanvasPath path) {
        mPaths.add(path);
        path.setHitSlop(mHitSlop);
        mChangedChildren = true;
    }

    protected void removePath(RCanvasPath path) {
        mPaths.remove(path);
        mChangedChildren = true;
    }

    protected void finalizeUpdate() {
        if (mChangedChildren) {
            mChangedChildren = false;
            eventHandler.emitPathsChange();
        }
    }

    public void setHardwareAcceleration(boolean useHardwareAcceleration) {
        mHardwareAccelerated = useHardwareAcceleration;
        Utility.setHardwareAcceleration(this, useHardwareAcceleration);
    }

    public void setStrokeColor(int color){
        mStrokeColor = color;
    }

    public void setStrokeWidth(float width){
        mStrokeWidth = width;
    }

    public void setHitSlop(RectF hitSlop){
        mHitSlop = hitSlop;
        for (RCanvasPath path: mPaths) {
            path.setHitSlop(mHitSlop);
        }
    }

    @Nullable public RCanvasPath getCurrentPath(){
        return mCurrentPath;
    }

    public void setCurrentPath(String id){
        mCurrentPath = getPath(id);
    }

    public RCanvasPath getPath(String id){
        for (RCanvasPath path: mPaths) {
            if (path.getPathId().equals(id)) {
                return path;
            }
        }

        throw new JSApplicationIllegalArgumentException(String.format("%s failed to find path#%s", RCanvasManager.TAG, id));
    }

    public int getPathIndex(String pathId){
        for (int i=0; i < mPaths.size(); i++) {
            if(pathId.equals(mPaths.get(i).getPathId())) {
                return i;
            }
        }
        return -1;
    }

    public ArrayList<RCanvasPath> getPaths() {
        return mPaths;
    }

    public void setAttributes(String id, ReadableMap attributes) {
        RCanvasPath path = getPath(id);
        if (attributes.hasKey("color")) {
            path.setStrokeColor(attributes.getInt("color"));
        }
        if (attributes.hasKey("width")) {
            path.setStrokeWidth(PixelUtil.toPixelFromDIP(attributes.getInt("width")));
        }

        path.postInvalidateOnAnimation();
        postInvalidateOnAnimation();
    }

    public void clear() {
        for (RCanvasPath path: mPaths) {
            removeView(path);
        }
        mPaths.clear();
        mCurrentPath = null;
        postInvalidateOnAnimation();
        eventHandler.emitPathsChange();
    }

    public void startPath() {
        startPath(Utility.generateId(), mStrokeColor, mStrokeWidth);
    }

    public void startPath(String id, @Nullable Integer strokeColor, @Nullable Float strokeWidth) {
        strokeColor = strokeColor == null ? mStrokeColor : strokeColor;
        strokeWidth = strokeWidth == null ? mStrokeWidth : strokeWidth;
        mCurrentPath = mNextPath;
        mCurrentPath.init(id, strokeColor, strokeWidth, mHitSlop);
        mPaths.add(mCurrentPath);

        eventHandler.emitStrokeStart();
    }

    public void addPoint(float x, float y, @Nullable String pathId) {
        @Nullable RCanvasPath current = mCurrentPath;
        if (current == null && pathId == null) {
            throw new JSApplicationCausedNativeException(
                    String.format("%s is trying to add point(%f, %f) on null object reference", RCanvasManager.TAG, x, y)
            );
        } else if (current != null && (pathId == null || current.getPathId().equals(pathId))) {
            addPoint(x, y);
        } else {
            setCurrentPath(pathId);
            addPoint(x, y);
            mCurrentPath = current;
        }

        postInvalidateOnAnimation();
    }

    public void addPoint(float x, float y) {
        addPoint(new PointF(x, y));
    }

    public void addPoint(PointF point) {
        UiThreadUtil.assertOnUiThread();
        mCurrentPath.addPoint(point);
        eventHandler.maybeEmitStrokeChange(point);
    }

    public void endPath() {
        UiThreadUtil.assertOnUiThread();
        if (mCurrentPath != null) {
            eventHandler.emitStrokeEnd();
            mCurrentPath = null;
            prepareNextPath();
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

    private void addPath(String id, int strokeColor, float strokeWidth, ArrayList<PointF> points) {
        boolean exist = false;
        for(RCanvasPath data: mPaths) {
            if (data.getPathId().equals(id)) {
                exist = true;
                break;
            }
        }

        if (!exist) {
            prepareNextPath();
            mNextPath.init(id, strokeColor, strokeWidth, mHitSlop, points);
            mPaths.add(mNextPath);
        } else {
            throw new JSApplicationIllegalArgumentException(String.format("%s: path#%s already exists", RCanvasManager.TAG, id));
        }
    }

    public void deletePaths(ReadableArray array) {
        String[] arr = new String[array.size()];
        for (int i = 0; i < array.size(); i++) {
            arr[i] = array.getString(i);
        }
        deletePaths(arr);
    }

    public void deletePaths(String[] arr) {
        for (String id: arr) {
            for (RCanvasPath path: mPaths) {
                if (id.equals(path.getPathId())) {
                    if (mCurrentPath.equals(path)){
                        endPath();
                    }
                    mPaths.remove(path);
                    removeView(path);
                }
            }
        }
        postInvalidateOnAnimation();
        eventHandler.emitPathsChange();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return eventHandler.onTouchEvent(event);
    }

    public void tearDown(){

    }
}
