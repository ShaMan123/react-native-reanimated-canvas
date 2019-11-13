package com.autodidact.reanimatedcanvas;

import android.graphics.Color;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class RCanvasPoint {
    public final int x;
    public final int y;
    public final int color;

    public RCanvasPoint(int x, int y, int color){
        this.x = x;
        this.y = y;
        this.color = color;
    }

    public boolean isTransparent(){
        return RCanvasPoint.isTransparent(color);
    }

    public int red(){
        return Color.red(color);
    }

    public int green(){
        return Color.green(color);
    }

    public int blue(){
        return Color.blue(color);
    }

    public int alpha(){
        return Color.alpha(color);
    }

    public WritableMap getColorMap() {
        WritableMap m = Arguments.createMap();
        m.putInt("red", red());
        m.putInt("green", green());
        m.putInt("blue", blue());
        m.putInt("alpha", alpha());
        return m;
    }

    public static boolean isTransparent(int color){
        return color == Color.TRANSPARENT;
    }

    public static double getHypot(RCanvasPoint a, RCanvasPoint b){
        double dx = (double)(a.x - b.x);
        double dy = (double)(a.y - b.y);
        return Math.hypot(dx, dy);
    }

}
