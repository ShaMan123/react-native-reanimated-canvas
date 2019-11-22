package com.autodidact.reanimatedcanvas;

import android.graphics.Point;
import android.graphics.PointF;
import android.graphics.RectF;

import com.facebook.jni.HybridData;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
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
    public static String generateId(){
        i++;
        return new StringBuilder("aSketchCanvasPath").append(i).toString();
    }

    public static ArrayList<PointF> processPointArray(ReadableArray points){
        ArrayList<PointF> pointPath;
        pointPath = new ArrayList<>(points.size());
        for (int i=0; i < points.size(); i++) {
            ReadableMap p = points.getMap(i);
            pointPath.add(
                    new PointF(
                            PixelUtil.toPixelFromDIP(p.getDouble("x")),
                            PixelUtil.toPixelFromDIP(p.getDouble("y"))
                    )
            );
        }
        return pointPath;
    }

    public static WritableMap toWritablePoint(PointF point) {
        WritableMap p = Arguments.createMap();
        p.putDouble("x", PixelUtil.toDIPFromPixel(point.x));
        p.putDouble("y", PixelUtil.toDIPFromPixel(point.y));
        return p;
    }

    public static float getDeviceScale(){
        return DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }
}