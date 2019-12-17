package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.PointF;
import android.graphics.RectF;
import android.graphics.Region;
import android.view.View;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.PixelUtil;

import java.util.ArrayList;

public final class Utility {
    public static RectF fillImage(float imgWidth, float imgHeight, float targetWidth, float targetHeight, String mode) {
        float imageAspectRatio = imgWidth / imgHeight;
        float targetAspectRatio = targetWidth / targetHeight;
        switch (mode) {
            case "AspectFill": {
                float scaleFactor = targetAspectRatio < imageAspectRatio ? targetHeight / imgHeight : targetWidth / imgWidth;
                float w = imgWidth * scaleFactor, h = imgHeight * scaleFactor;
                return new RectF((targetWidth - w) / 2, (targetHeight - h) / 2, 
                    w + (targetWidth - w) / 2, h + (targetHeight - h) / 2);
            }
            case "AspectFit":
            default: {
                float scaleFactor = targetAspectRatio > imageAspectRatio ? targetHeight / imgHeight : targetWidth / imgWidth;
                float w = imgWidth * scaleFactor, h = imgHeight * scaleFactor;
                return new RectF((targetWidth - w) / 2, (targetHeight - h) / 2, 
                    w + (targetWidth - w) / 2, h + (targetHeight - h) / 2);
            }
            case "ScaleToFill": {
                return  new RectF(0, 0, targetWidth, targetHeight);
            }
        }
    }

    private static int i = 0;
    static String generateId(){
        i++;
        return new StringBuilder("aSketchCanvasPath").append(i).toString();
    }

    static ArrayList<PointF> processPointArray(ReadableArray points){
        ArrayList<PointF> processedPoints;
        processedPoints = new ArrayList<>(points.size());
        for (int i=0; i < points.size(); i++) {
            ReadableMap p = points.getMap(i);
            processedPoints.add(
                    new PointF(
                            PixelUtil.toPixelFromDIP(p.getDouble("x")),
                            PixelUtil.toPixelFromDIP(p.getDouble("y"))
                    )
            );
        }
        return processedPoints;
    }

    static WritableMap toWritablePoint(PointF point) {
        WritableMap p = Arguments.createMap();
        p.putDouble("x", PixelUtil.toDIPFromPixel(point.x));
        p.putDouble("y", PixelUtil.toDIPFromPixel(point.y));
        return p;
    }

    public static RectF toRect(ReadableMap rect) {
        return new RectF(
                ((float) rect.getDouble("left")),
                ((float) rect.getDouble("top")),
                ((float) rect.getDouble("right")),
                ((float) rect.getDouble("bottom"))
        );
    }

    static void setHardwareAcceleration(View view, Boolean useHardwareAcceleration){
        if(useHardwareAcceleration) {
            view.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        } else{
            view.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
    }

    public static float getDeviceScale(){
        return DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }

    static RectF parseHitSlop(@Nullable ReadableMap hitSlop) {
        if (hitSlop == null) {
            return new RectF();
        } else {
            return new RectF(
                    hitSlop.hasKey("left") ? PixelUtil.toPixelFromDIP(hitSlop.getDouble("left")) : 0,
                    hitSlop.hasKey("top") ? PixelUtil.toPixelFromDIP(hitSlop.getDouble("top")) : 0,
                    hitSlop.hasKey("right") ? PixelUtil.toPixelFromDIP(hitSlop.getDouble("right")) : 0,
                    hitSlop.hasKey("bottom") ? PixelUtil.toPixelFromDIP(hitSlop.getDouble("bottom")) : 0
            );
        }
    }

    static RectF applyHitSlop(PointF point, RectF hitSlop) {
        return new RectF(
                Math.max(point.x - hitSlop.left, 0),
                Math.max(point.y - hitSlop.top, 0),
                point.x + hitSlop.right,
                point.y + hitSlop.bottom
        );
    }

    @TargetApi(19)
    static Region getViewRegion(View view){
        return new Region(
                view.getLeft(),
                view.getTop(),
                view.getRight(),
                view.getBottom()
        );
    }
}