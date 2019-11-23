package com.autodidact.reanimatedcanvas;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;

import java.util.ArrayList;

public class RCanvas extends View {
    public final static String TAG = "RNReanimatedCanvas";

    private ArrayList<RCanvasPath> mPaths = new ArrayList<RCanvasPath>();
    private RCanvasPath mCurrentPath = null;

    private boolean mDisableHardwareAccelerated = false;
    private int mStrokeColor;
    private int mStrokeWidth;

    private final RCanvasEventHandler eventHandler;
    private final RCanvasTextHelper mTextHelper;
    private final RCanvasImageHelper mImageHelper;
    private final PathIntersectionHelper mIntersectionHelper;

    public RCanvas(ThemedReactContext context) {
        super(context);
        eventHandler = new RCanvasEventHandler(this);
        mTextHelper = new RCanvasTextHelper(this);
        mImageHelper = new RCanvasImageHelper(this);
        mIntersectionHelper = new PathIntersectionHelper(this);
    }

    public RCanvasEventHandler getEventHandler(){
        return eventHandler;
    }
    public RCanvasTextHelper getTextHelper(){
        return mTextHelper;
    }
    public RCanvasImageHelper getImageHelper(){
        return mImageHelper;
    }
    public PathIntersectionHelper getIntersectionHelper(){
        return mIntersectionHelper;
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return eventHandler.onTouchEvent(event);
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

    public void setStrokeWidth(int width){
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

        invalidate();
    }

    public void clear() {
        mPaths.clear();
        mCurrentPath = null;
        invalidate();
        eventHandler.emitPathsChange();
    }

    public void startPath() {
        startPath(Utility.generateId(), mStrokeColor, mStrokeWidth);
    }

    public void startPath(String id, int strokeColor, float strokeWidth) {
        mCurrentPath = new RCanvasPath(id, strokeColor, strokeWidth);
        mPaths.add(mCurrentPath);
        boolean isErase = strokeColor == Color.TRANSPARENT;
        if (isErase && !mDisableHardwareAccelerated) {
            mDisableHardwareAccelerated = true;
            setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }

        invalidate();
        eventHandler.emitStrokeStart();
    }

    public void addPoint(float x, float y, @Nullable String pathId) {
        @Nullable RCanvasPath current = mCurrentPath;
        if (pathId == null || current.id.equals(pathId)) {
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
        mCurrentPath.addPoint(point);
        invalidate();
    }

    public void end() {
        if (mCurrentPath != null) {
            eventHandler.emitStrokeEnd();
            mCurrentPath = null;
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

        invalidate();
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
        String id;
        for (int k = 0; k < arr.length; k++) {
            id = arr[k];
            for (RCanvasPath path: mPaths) {
                if (id.equals(path.id)) {
                    if (mCurrentPath.equals(path)){
                        end();
                    }
                    mPaths.remove(path);
                }
            }
        }

        invalidate();
        eventHandler.emitPathsChange();
    }

    @Override
    protected void onSizeChanged(final int w, final int h, final int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        if (getWidth() > 0 && getHeight() > 0 && (w != oldw || h != oldh)) {
            mTextHelper.position();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        drawOnCanvas(canvas);
    }

    protected void drawOnCanvas(Canvas canvas) {
        drawOnCanvas(canvas, true, true);
    }

    protected void drawOnCanvas(Canvas canvas, Boolean drawBackgroundImage, Boolean drawText){
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.MULTIPLY);
        if (drawBackgroundImage) {
            mImageHelper.draw(canvas);
        }
        if (drawText) {
            mTextHelper.drawBackground(canvas);
        }
        for(RCanvasPath path: mPaths) {
            path.draw(canvas);
        }
        if (drawText) {
            mTextHelper.drawForeground(canvas);
        }
    }

    public void tearDown(){

    }
}
