package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.Color;
import android.graphics.Region;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;

import java.util.ArrayList;

public class PathIntersectionHelper {
    private float mTouchRadius = 0;
    private final RCanvas mView;

    public PathIntersectionHelper(RCanvas view) {
        mView = view;
    }

    private ArrayList<RCanvasPath> getPaths() {
        return mView.getPaths();
    }

    private int getIndex(String pathId) {
        return mView.getPathIndex(pathId);
    }

    @TargetApi(19)
    private Region getRegion(){
        return new Region(
                mView.getLeft(),
                mView.getTop(),
                mView.getRight(),
                mView.getBottom()
        );
    }

    public void setTouchRadius(int value){
        mTouchRadius = ((float) value);
    }
    public void setTouchRadius(float value){
        mTouchRadius = value;
    }

    public float getTouchRadius(){
        return mTouchRadius;
    }

    public float getTouchRadius(float strokeWidth){
        return mTouchRadius <= 0 && strokeWidth > 0? (strokeWidth * 0.5f): mTouchRadius;
    }

    @TargetApi(19)
    public boolean isTransparent(float x, float y, String pathId){
        ArrayList<RCanvasPath> mPaths = getPaths();
        int start = getIndex(pathId);
        //int beginAt = Math.min(start + 1, mPaths.size() - 1);
        for (int i = start; i < mPaths.size(); i++){
            RCanvasPath mPath = mPaths.get(i);
            if(mPath.isPointOnPath(x, y, getTouchRadius(mPath.getStrokeWidth()), getRegion()) && mPath.getStrokeColor() == Color.TRANSPARENT) {
                return true;
            }
        }
        return false;
    }

    @TargetApi(19)
    public boolean isPointOnPath(float x, float y, String pathId){
        if(isTransparent(x, y, pathId)) {
            return false;
        }
        else {
            RCanvasPath mPath = getPaths().get(getIndex(pathId));
            return mPath.isPointOnPath(x, y, getTouchRadius(mPath.getStrokeWidth()), getRegion());
        }
    }

    @TargetApi(19)
    public WritableArray isPointOnPath(float x, float y){
        WritableArray array = Arguments.createArray();
        Region mRegion = getRegion();
        float r;
        RCanvasPath mPath;
        ArrayList<RCanvasPath> paths = getPaths();
        String id;

        for (int i = 0; i < paths.size(); i++) {
            mPath = paths.get(i);
            id = mPath.getPathId();
            r = getTouchRadius(mPath.getStrokeWidth());
            if(mPath.isPointOnPath(x, y, r, mRegion) && !isTransparent(x, y, id)){
                array.pushString(id);
            }
        }

        return array;
    }
}
