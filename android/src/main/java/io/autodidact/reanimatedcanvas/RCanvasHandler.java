package io.autodidact.reanimatedcanvas;

import android.util.SparseIntArray;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

import io.autodidact.reanimatedcanvas.RPath.ResizeMode;

public class RCanvasHandler extends RCanvas {

    private final ArrayList<Integer> reactTagRegistry = new ArrayList<>();
    private final RCanvasEventDispatcher mEventDispatcher;
    private final ArrayList<RPath> added = new ArrayList<>();
    private final ArrayList<RPath> removed = new ArrayList<>();

    public RCanvasHandler(ThemedReactContext context) {
        super(context);
        mEventDispatcher = new RCanvasEventDispatcher(context, this);
    }

    @Override
    public ArrayList<RPath> restore(int saveCount) {
        ArrayList<RPath> changed = super.restore(saveCount);
        mEventDispatcher.emitChange(null, changed, null);
        return changed;
    }

    @Override
    public void init(int pathId, @Nullable Integer strokeColor, @Nullable Float strokeWidth,
                     @Nullable @ResizeMode String resizeMode) {
        super.init(pathId, strokeColor, strokeWidth, resizeMode);
        ArrayList<RPath> added = new ArrayList<>();
        added.add(getPath(pathId));
        mEventDispatcher.emitChange(added, null, null);
    }

    @Override
    public void endInteraction(int pathId) {
        super.endInteraction(pathId);
        ArrayList<RPath> changed = new ArrayList<>();
        changed.add(getPath(pathId));
        mEventDispatcher.emitChange(null ,changed, null);
    }

    @Override
    public void clear() {
        ArrayList<RPath> pathsToRemove = new ArrayList<>(mPaths);
        super.clear();
        mEventDispatcher.emitChange(null, null, pathsToRemove);
    }

    public void handleUpdate(@Nullable ReadableArray pathsUpdate) {
        if (pathsUpdate == null) return;
        ArrayList<RPath> pathsToRemove = new ArrayList<>();
        ReadableMap entry, update;
        boolean exists, remove;
        int pathId;

        for (int i = 0; i < pathsUpdate.size(); i++) {
            entry = pathsUpdate.getMap(i);
            pathId = entry.getInt("id");
            update = entry.getMap("value");
            exists = getPathIndex(pathId) > -1;
            remove = update == null;

            if (!remove && !exists) {
                init(pathId);
                setAttributes(pathId, update, false);
            } else if (!remove) {
                setAttributes(pathId, update, false);
            } else if (exists) {
                pathsToRemove.add(getPath(pathId));
            }
        }

        if (pathsToRemove.size() > 0) {
            removePaths(pathsToRemove);
        }

        postInvalidateOnAnimation();
    }

    public void setAttributes(int id, ReadableMap attributes, boolean standalone) {
        RPath path = getPath(id);
        if (standalone) {
            path.getState().startListening();
        }

        if (attributes.hasKey("strokeColor")) {
            path.setStrokeColor(attributes.getInt("strokeColor"));
        }
        if (attributes.hasKey("strokeWidth")) {
            path.setStrokeWidth(PixelUtil.toPixelFromDIP(attributes.getInt("strokeWidth")));
        }
        if (attributes.hasKey("resizeMode")) {
            path.setResizeMode(attributes.getString("resizeMode"));
        }
        if (attributes.hasKey("points")) {
            path.setPoints(Utility.processPointArray(attributes.getArray("points")));
        }
        if (attributes.hasKey("hitSlop")) {
            path.setHitSlop(Utility.parseHitSlop(attributes.getMap("hitSlop")), true);
        }

        if (standalone) {
            postInvalidateOnAnimation();
            if (path.getState().updatedInCycle()) {
                ArrayList<RPath> changed = new ArrayList<>();
                changed.add(getPath(id));
                mEventDispatcher.emitChange(null, changed, null);
            }
        }

    }

    protected void finalizePathAddition(RPath path) {
        if (getPathIndex(path.getPathId()) != -1) {
            throw new JSApplicationIllegalArgumentException(
                String.format(
                    "%s failed to add %s,\nid `%s` already exists",
                    getClass().getSimpleName(),
                    path,
                    path.getPathId())
            );
        }
        mPaths.add(path);
        path.setHitSlop(mHitSlop);
        added.add(path);
        reactTagRegistry.add(path.getId());
        finalizeUpdate();
    }

    protected void finalizePathRemoval(RPath path) {
        mPaths.remove(path);
        removed.add(path);
        Number tag = path.getId();
        reactTagRegistry.remove(tag);
        finalizeUpdate();
    }

    protected void finalizeUpdate() {
        if (added.size() > 0 || removed.size() > 0) {
            mEventDispatcher.emitChange(added.size() > 0 ? added : null, null, removed.size() > 0 ? removed : null);
            added.clear();
            removed.clear();
        }
    }

    protected void finalizeUpdate(RPath path) {
        ArrayList<RPath> changed = new ArrayList<>();
        changed.add(path);
        mEventDispatcher.emitChange(null, changed, null);
    }

    @Override
    protected final void removePaths(final ArrayList<RPath> paths) {
        final ReactContext context = (ReactContext) getContext();
        final UIImplementation uiImplementation = context.getNativeModule(UIManagerModule.class).getUIImplementation();
        final SparseIntArray tagsToRemove = new SparseIntArray();

        mPaths.removeAll(paths);

        for (int i = 0; i < getChildCount(); i++) {
            for (RPath path: paths) {
                if (getChildAt(i).getId() == path.getId()) {
                    if (reactTagRegistry.indexOf(path.getId()) > -1) {
                        tagsToRemove.put(i, path.getId());
                    }
                    removeView(path);
                }
            }
        }

        if (tagsToRemove.size() > 0) {
            Utility.runOnNativeModulesThread((ReactContext) getContext(), new Runnable() {
                @Override
                public void run() {
                    ReactShadowNode shadowNode;
                    ReactShadowNode parentShadowNode;
                    for (int i = 0; i < tagsToRemove.size(); i++) {
                        shadowNode = uiImplementation.resolveShadowNode(tagsToRemove.valueAt(i));
                        parentShadowNode = shadowNode.getParent();
                        if (parentShadowNode != null) {
                            parentShadowNode.removeChildAt(tagsToRemove.keyAt(i));
                            parentShadowNode.addChildAt(ViewManagerStub.stubShadowNode(shadowNode), tagsToRemove.keyAt(i));
                        }
                    }
                }
            });
        }
    }
}
