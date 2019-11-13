package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
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
    public void transferToBase64(final int tag, final String type, final boolean transparent, 
        final boolean includeImage, final boolean includeText, final boolean cropToImageSize, final Callback callback){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    RCanvas view = (RCanvas) nvhm.resolveView(tag);
                    view.getBase64(type, transparent, includeImage, includeText, cropToImageSize, callback);
                }
            });
        } catch (Exception e) {
            callback.invoke(e.getMessage(), null);
        }
    }

    @ReactMethod
    @TargetApi(19)
    public void isPointOnPath(final int tag, final float x, final float y, @Nullable final String pathId, final Callback callback){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    RCanvas view = (RCanvas) nvhm.resolveView(tag);
                    float nativeX = PixelUtil.toPixelFromDIP(x);
                    float nativeY = PixelUtil.toPixelFromDIP(y);
                    callback.invoke(null, pathId == null ? view.isPointOnPath(nativeX, nativeY): view.isPointOnPath(nativeX, nativeY, pathId));
                }
            });
        } catch (Exception e) {
            callback.invoke(e.getMessage(), null);
        }
    }

    @ReactMethod
    public void setTouchRadius(final int tag, final float r, final Callback callback){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    RCanvas view = (RCanvas) nvhm.resolveView(tag);
                    view.setTouchRadius(PixelUtil.toPixelFromDIP(r));
                    callback.invoke(null, true);
                }
            });
        } catch (Exception e) {
            callback.invoke(e.getMessage(), null);
        }
    }
}