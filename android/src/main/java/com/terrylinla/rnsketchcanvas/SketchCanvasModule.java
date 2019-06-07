package com.terrylinla.rnsketchcanvas;

import android.annotation.TargetApi;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;

import javax.annotation.Nullable;

public class SketchCanvasModule extends ReactContextBaseJavaModule {
    SketchCanvasModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SketchCanvasModule";
    }

    @ReactMethod
    public void transferToBase64(final int tag, final String type, final boolean transparent, 
        final boolean includeImage, final boolean includeText, final boolean cropToImageSize, final Callback callback){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    SketchCanvas view = (SketchCanvas) nvhm.resolveView(tag);
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
                    SketchCanvas view = (SketchCanvas) nvhm.resolveView(tag);
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
    public void setTouchRadius(final int tag, final int r, final Callback callback){
        try {
            final ReactApplicationContext context = getReactApplicationContext();
            UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
            uiManager.addUIBlock(new UIBlock() {
                public void execute(NativeViewHierarchyManager nvhm) {
                    SketchCanvas view = (SketchCanvas) nvhm.resolveView(tag);
                    view.setTouchRadius((int)PixelUtil.toPixelFromDIP(r));
                    callback.invoke(null, true);
                }
            });
        } catch (Exception e) {
            callback.invoke(e.getMessage(), null);
        }
    }
}