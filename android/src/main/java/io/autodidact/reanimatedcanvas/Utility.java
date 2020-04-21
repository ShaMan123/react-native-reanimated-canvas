package io.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.PointF;
import android.graphics.RectF;
import android.graphics.Region;
import android.view.View;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.PixelUtil;

import java.util.ArrayList;

public final class Utility {

    private static int i = 0;

    /**
     * native path ids are negative, while path ids received from js are positive in order to avoid conflicts
     * @return pathID
     */
    static int generateId(){
        i++;
        return -i;
    }

    static PointF processPoint(ReadableMap point) {
        return new PointF(
                PixelUtil.toPixelFromDIP(point.getDouble("x")),
                PixelUtil.toPixelFromDIP(point.getDouble("y"))
        );
    }

    static ArrayList<PointF> processPointArray(ReadableArray points){
        ArrayList<PointF> processedPoints;
        processedPoints = new ArrayList<>(points.size());
        for (int i=0; i < points.size(); i++) {
            ReadableMap p = points.getMap(i);
            processedPoints.add(processPoint(p));
        }
        return processedPoints;
    }

    static WritableMap toWritablePoint(PointF point) {
        WritableMap p = Arguments.createMap();
        p.putDouble("x", PixelUtil.toDIPFromPixel(point.x));
        p.putDouble("y", PixelUtil.toDIPFromPixel(point.y));
        return p;
    }

    static String[] processStringArray(ReadableArray array) {
        String[] arr = new String[array.size()];
        for (int i = 0; i < array.size(); i++) {
            arr[i] = array.getString(i);
        }
        return arr;
    }

    public static RectF toRect(ReadableMap rect) {
        return new RectF(
                ((float) rect.getDouble("left")),
                ((float) rect.getDouble("top")),
                ((float) rect.getDouble("right")),
                ((float) rect.getDouble("bottom"))
        );
    }

    public static float getDeviceScale(){
        return DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }

    static RectF parseHitSlop(@Nullable ReadableMap hitSlop) {
        if (hitSlop == null) {
            return new RectF();
        } else {
            return new RectF(
                    hitSlop.hasKey("left") ? Math.max(0, PixelUtil.toPixelFromDIP(hitSlop.getDouble("left"))) : 0,
                    hitSlop.hasKey("top") ? Math.max(0, PixelUtil.toPixelFromDIP(hitSlop.getDouble("top"))) : 0,
                    hitSlop.hasKey("right") ? Math.max(0, PixelUtil.toPixelFromDIP(hitSlop.getDouble("right"))) : 0,
                    hitSlop.hasKey("bottom") ? Math.max(0, PixelUtil.toPixelFromDIP(hitSlop.getDouble("bottom"))) : 0
            );
        }
    }

    static RectF applyHitSlop(PointF point, RectF hitSlop) {
        return new RectF(
                point.x - hitSlop.left,
                point.y - hitSlop.top,
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

    static void runOnNativeModulesThread(ReactContext context, Runnable action) {
        if (context.isOnNativeModulesQueueThread()) {
            action.run();
        } else {
            context.runOnNativeModulesQueueThread(action);
        }
    }

    static String parseColorForJS(int color) {
        String rawHex = String.format("%08x", color);
        return String.format("#%s%s", rawHex.substring(2), rawHex.substring(0, 2));
    }
}