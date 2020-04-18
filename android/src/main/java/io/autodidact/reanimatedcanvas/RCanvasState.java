package io.autodidact.reanimatedcanvas;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.PixelUtil;

import java.util.HashMap;

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
        out.putString("strokeColor", Utility.parseColorForJS(strokeColor));
        out.putDouble("strokeWidth", PixelUtil.toDIPFromPixel(strokeWidth));
        return out;
    }

    @NonNull
    @Override
    public String toString() {
        HashMap<String, Object> out = new HashMap<>();
        out.put("strokeColor", Utility.parseColorForJS(strokeColor));
        out.put("strokeWidth", PixelUtil.toDIPFromPixel(strokeWidth));
        return out.toString();
    }
}
