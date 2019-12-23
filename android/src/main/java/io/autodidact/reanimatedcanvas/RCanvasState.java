package io.autodidact.reanimatedcanvas;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.PixelUtil;

public class RCanvasState {
    int strokeColor;
    float strokeWidth;

    RCanvasState(int strokeColor, float strokeWidth) {
        this();
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }

    RCanvasState() {}

    WritableMap toWritableMap() {
        WritableNativeMap out = new WritableNativeMap();
        out.putInt("strokeColor", strokeColor);
        out.putDouble("strokeWidth", PixelUtil.toDIPFromPixel(strokeWidth));
        return out;
    }
}
