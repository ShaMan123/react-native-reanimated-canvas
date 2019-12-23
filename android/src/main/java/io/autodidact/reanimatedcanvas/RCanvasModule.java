package io.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.PointF;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;

import javax.annotation.Nullable;

@ReactModule(name = RCanvasModule.NAME)
public class RCanvasModule extends ReactContextBaseJavaModule {
    static final String NAME = "ReanimatedCanvasModule";

    RCanvasModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    @TargetApi(19)
    public void isPointOnPath(final int tag, final float x, final float y, @Nullable final String pathId, final Callback success, final Callback error) {
        try {
            run(tag, new Runnable() {
                @Override
                public void run(RCanvas view) {
                    PathIntersectionHelper intersectionHelper = view.getIntersectionHelper();
                    PointF point = new PointF(PixelUtil.toPixelFromDIP(x), PixelUtil.toPixelFromDIP(y));
                    success.invoke(pathId == null ?
                            intersectionHelper.isPointOnPath(point):
                            intersectionHelper.isPointOnPath(point, pathId)
                    );
                }
            });
        } catch (Throwable e) {
            error.invoke(e);
        }
    }

    @ReactMethod
    public void getPaths(final int tag, final ReadableArray idArray, final boolean includePoints, final Callback success, final Callback error) {
        try {
            run(tag, new Runnable() {
                @Override
                public void run(RCanvas view) {
                    WritableNativeArray paths = new WritableNativeArray();
                    String pathId;
                    for (int i = 0; i < idArray.size(); i++) {
                        pathId = idArray.getString(i);
                        paths.pushMap(view.getPath(pathId).toWritableMap(includePoints));
                    }
                    success.invoke(paths);
                }
            });
        } catch (Exception e) {
            error.invoke(e);
        }
    }

    @ReactMethod
    public void save(final int tag, final Callback success, final Callback error) {
        try {
            run(tag, new Runnable() {
                @Override
                public void run(RCanvas view) {
                    success.invoke(view.save());
                }
            });
        } catch (Exception e) {
            error.invoke(e);
        }
    }

    @ReactMethod
    public void restore(final int tag, final int saveCount, final Callback success, final Callback error) {
        try {
            run(tag, new Runnable() {
                @Override
                public void run(RCanvas view) {
                    view.restore(saveCount);
                    success.invoke();
                }
            });
        } catch (Exception e) {
            error.invoke(e);
        }
    }

    interface Runnable {
        void run(RCanvas view);
    }

    private void run(final int tag, final Runnable action) {
        final ReactApplicationContext context = getReactApplicationContext();
        UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
        uiManager.addUIBlock(new UIBlock() {
            public void execute(NativeViewHierarchyManager nvhm) {
                RCanvas view = (RCanvas) nvhm.resolveView(tag);
                action.run(view);
            }
        });
    }
}