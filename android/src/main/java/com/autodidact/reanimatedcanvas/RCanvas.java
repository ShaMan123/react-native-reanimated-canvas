package com.autodidact.reanimatedcanvas;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Picture;
import android.graphics.PointF;
import android.graphics.Rect;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;

public class RCanvas extends ReactViewGroup {

    private ArrayList<RCanvasPath> mPaths = new ArrayList<RCanvasPath>();
    private RCanvasPath mCurrentPath = null;

    private boolean mDisableHardwareAccelerated = false;
    private int mStrokeColor;
    private float mStrokeWidth;

    private final RCanvasEventHandler eventHandler;
    private final PathIntersectionHelper mIntersectionHelper;

    public RCanvas(ThemedReactContext context) {
        super(context);
        eventHandler = new RCanvasEventHandler(this);
        mIntersectionHelper = new PathIntersectionHelper(this);
    }

    public RCanvasEventHandler getEventHandler(){
        return eventHandler;
    }
    public PathIntersectionHelper getIntersectionHelper(){
        return mIntersectionHelper;
    }

    public void setHardwareAccelerated(boolean useHardwareAccelerated) {
        mDisableHardwareAccelerated = !useHardwareAccelerated;
        if(useHardwareAccelerated) {
            setLayerType(View.LAYER_TYPE_HARDWARE, null);
        } else{
            setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
    }

    public void setStrokeColor(int color){
        mStrokeColor = color;
    }

    public void setStrokeWidth(float width){
        mStrokeWidth = width;
    }

    @Nullable public RCanvasPath getCurrentPath(){
        return mCurrentPath;
    }

    public void setCurrentPath(String id){
        mCurrentPath = getPath(id);
    }

    public RCanvasPath getPath(String id){
        for (RCanvasPath path: mPaths) {
            if (path.id.equals(id)) {
                return path;
            }
        }

        throw new JSApplicationIllegalArgumentException("RCanvas failed to find path with id + " + id);
    }

    public int getPathIndex(String pathId){
        for (int i=0; i < mPaths.size(); i++) {
            if(pathId.equals(mPaths.get(i).id)) {
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
            path.strokeColor = attributes.getInt("color");
        }
        if (attributes.hasKey("width")) {
            path.strokeWidth = PixelUtil.toPixelFromDIP(attributes.getInt("width"));
        }

        postInvalidateOnAnimation();
    }

    public void clear() {
        mPaths.clear();
        mCurrentPath = null;
        invalidatePicture();
        eventHandler.emitPathsChange();
    }

    public void startPath() {
        startPath(Utility.generateId(), mStrokeColor, mStrokeWidth);
    }

    public void startPath(String id, @Nullable Integer strokeColor, @Nullable Float strokeWidth) {
        strokeColor = strokeColor == null ? mStrokeColor : strokeColor;
        strokeWidth = strokeWidth == null ? mStrokeWidth : strokeWidth;
        mCurrentPath = new RCanvasPath(id, strokeColor, strokeWidth);
        mPaths.add(mCurrentPath);
        boolean isErase = strokeColor == Color.TRANSPARENT;
        if (isErase && !mDisableHardwareAccelerated) {
            mDisableHardwareAccelerated = true;
            setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }

        eventHandler.emitStrokeStart();
    }

    public void addPoint(float x, float y, @Nullable String pathId) {
        @Nullable RCanvasPath current = mCurrentPath;
        if (current == null) {
            Log.w(ReactConstants.TAG, "RCanvas trying to add point on null object reference");
        } else if (pathId == null || current.id.equals(pathId)) {
            addPoint(x, y);
        } else {
            setCurrentPath(pathId);
            addPoint(x, y);
            mCurrentPath = current;
        }
    }

    public void addPoint(float x, float y) {
        addPoint(new PointF(x, y));
    }

    public void addPoint(PointF point) {
        UiThreadUtil.assertOnUiThread();
        mCurrentPath.addPoint(point);
        /*
        Canvas canvas = picture.beginRecording(getWidth(), getHeight());
        mCurrentPath.draw(canvas);
        picture.endRecording();

         */
        postInvalidateOnAnimation();
        eventHandler.maybeEmitStrokeChange(point);
    }

    private Picture picture = new Picture();
    private Picture mFullPicture = new Picture();
    private Picture mChildrenPicture = new Picture();

    public void endPath() {
        UiThreadUtil.assertOnUiThread();
        if (mCurrentPath != null) {
            eventHandler.emitStrokeEnd();
            mCurrentPath = null;
            invalidatePicture(false);
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

        invalidatePicture();
        eventHandler.emitPathsChange();
    }

    private void addPath(String id, int strokeColor, float strokeWidth, ArrayList<PointF> points) {
        boolean exist = false;
        for(RCanvasPath data: mPaths) {
            if (data.id.equals(id)) {
                exist = true;
                break;
            }
        }

        if (!exist) {
            RCanvasPath newPath = new RCanvasPath(id, strokeColor, strokeWidth, points);
            mPaths.add(newPath);
            boolean isErase = strokeColor == Color.TRANSPARENT;
            if (isErase && !mDisableHardwareAccelerated) {
                mDisableHardwareAccelerated = true;
                setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            }
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
                if (id.equals(path.id)) {
                    if (mCurrentPath.equals(path)){
                        endPath();
                    }
                    mPaths.remove(path);
                }
            }
        }
        invalidatePicture();
        eventHandler.emitPathsChange();
    }

    private void invalidatePicture() { invalidatePicture(true); }

    private void invalidatePicture(Boolean invalidateView) {
        /*
        Canvas canvas = mFullPicture.beginRecording(getWidth(), getHeight());
        drawPaths(canvas);
        mFullPicture.endRecording();

         */
        if (invalidateView) {
            postInvalidateOnAnimation();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        draw(canvas, false);
    }

    @Override
    protected void dispatchDraw(Canvas canvas) {
        draw(canvas, true);
    }

    private Boolean mDidDraw = false;
    @SuppressLint("WrongCall")
    private void draw(Canvas canvas, Boolean dispatchDraw) {
        //canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.MULTIPLY);
        if (dispatchDraw) {
            super.dispatchDraw(canvas);
        } else {
            super.onDraw(canvas);
        }

        //drawPaths(canvas);
        drawPaths(canvas);
    }

    private void drawPaths(Canvas canvas){
        for(RCanvasPath path: mPaths) {
            path.draw(canvas);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return eventHandler.onTouchEvent(event);
    }

    public void tearDown(){

    }
}
