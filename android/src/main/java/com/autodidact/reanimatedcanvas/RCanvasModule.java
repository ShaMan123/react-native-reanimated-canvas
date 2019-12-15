package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;

import javax.annotation.Nullable;

@ReactModule(name = RCanvasModule.NAME)
public class RCanvasModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ReanimatedCanvasModule";

    RCanvasModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    @TargetApi(19)
    public void isPointOnPath(final int tag, final float x, final float y, @Nullable final String pathId, final Callback success, final Callback error){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    RCanvas view = (RCanvas) nvhm.resolveView(tag);
                    PathIntersectionHelper intersectionHelper = view.getIntersectionHelper();
                    float nativeX = PixelUtil.toPixelFromDIP(x);
                    float nativeY = PixelUtil.toPixelFromDIP(y);
                    success.invoke(pathId == null ?
                            intersectionHelper.isPointOnPath(nativeX, nativeY):
                            intersectionHelper.isPointOnPath(nativeX, nativeY, pathId)
                    );
                }
            });
        } catch (Throwable e) {
            error.invoke(e);
        }
    }

    @ReactMethod
    public void setTouchRadius(final int tag, final float r, final Callback success, final Callback error){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    RCanvas view = (RCanvas) nvhm.resolveView(tag);
                    view.getIntersectionHelper().setTouchRadius(PixelUtil.toPixelFromDIP(r));
                    success.invoke(true);
                }
            });
        } catch (Exception e) {
            error.invoke(e);
        }
    }
}