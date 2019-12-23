package io.autodidact.reanimatedcanvas;

import android.util.SparseIntArray;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

public class RCanvasHandler extends RCanvas {

    private final ArrayList<Integer> reactTagRegistry = new ArrayList<>();
    private final RCanvasEventDispatcher mEventDispatcher;
    private final ArrayList<RCanvasPath> added = new ArrayList<>();
    private final ArrayList<RCanvasPath> removed = new ArrayList<>();

    public RCanvasHandler(ThemedReactContext context) {
        super(context);
        mEventDispatcher = new RCanvasEventDispatcher(context, this);
    }

    @Override
    public ArrayList<RCanvasPath> restore(int saveCount) {
        ArrayList<RCanvasPath> changed = super.restore(saveCount);
        mEventDispatcher.emitChange(null, changed, null);
        return changed;
    }

    @Override
    public void init(String pathId, @Nullable Integer strokeColor, @Nullable Float strokeWidth) {
        super.init(pathId, strokeColor, strokeWidth);
        ArrayList<RCanvasPath> added = new ArrayList<>();
        added.add(getPath(pathId));
        mEventDispatcher.emitChange(added, null, null);
    }

    @Override
    public void endInteraction(String pathId) {
        super.endInteraction(pathId);
        ArrayList<RCanvasPath> changed = new ArrayList<>();
        changed.add(getPath(pathId));
        mEventDispatcher.emitChange(null ,changed, null);
    }

    @Override
    public void clear() {
        ArrayList<RCanvasPath> pathsToRemove = new ArrayList<>(mPaths);
        super.clear();
        mEventDispatcher.emitChange(null, null, pathsToRemove);
    }

    public void handleUpdate(@Nullable ReadableMap paths) {
        if (paths == null) return;
        ArrayList<RCanvasPath> pathsToRemove = new ArrayList<>();
        Iterator<Map.Entry<String, Object>> iterator = paths.getEntryIterator();
        Map.Entry<String, Object> entry;
        boolean exists;
        boolean remove;
        String pathId;

        while (iterator.hasNext()) {
            entry = iterator.next();
            exists = getPathIndex(entry.getKey()) > -1;
            remove = entry.getValue() == null;
            pathId = entry.getKey();

            if (!exists) {
                addPath(pathId);
                setAttributes(pathId, (ReadableMap) entry.getValue(), false);
            } else if (!remove) {
                setAttributes(pathId, (ReadableMap) entry.getValue(), false);
            } else {
                pathsToRemove.add(getPath(pathId));
            }

        }

        if (pathsToRemove.size() > 0) {
            removePaths(pathsToRemove);
        }

        postInvalidateOnAnimation();
    }

    public void setAttributes(String id, ReadableMap attributes, boolean standalone) {
        RCanvasPath path = getPath(id);
        if (standalone) {
            path.getState().startListening();
        }

        if (attributes.hasKey("strokeColor")) {
            path.setStrokeColor(attributes.getInt("strokeColor"));
        }
        if (attributes.hasKey("strokeWidth")) {
            path.setStrokeWidth(PixelUtil.toPixelFromDIP(attributes.getInt("strokeWidth")));
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
                ArrayList<RCanvasPath> changed = new ArrayList<>();
                changed.add(getPath(id));
                mEventDispatcher.emitChange(null, changed, null);
            }
        }

    }

    protected void finalizePathAddition(RCanvasPath path) {
        mPaths.add(path);
        path.setHitSlop(mHitSlop);
        added.add(path);
        reactTagRegistry.add(path.getId());
    }

    protected void finalizePathRemoval(RCanvasPath path) {
        mPaths.remove(path);
        removed.add(path);
        Number tag = path.getId();
        reactTagRegistry.remove(tag);
    }

    protected void finalizeUpdate() {
        if (added.size() > 0 || removed.size() > 0) {
            mEventDispatcher.emitChange(added, null, removed);
            added.clear();
            removed.clear();
        }
    }

    protected void finalizeUpdate(RCanvasPath path) {
        ArrayList<RCanvasPath> changed = new ArrayList<>();
        changed.add(path);
        mEventDispatcher.emitChange(null, changed, null);
    }

    @Override
    protected final void removePaths(final ArrayList<RCanvasPath> paths) {
        final ReactContext context = (ReactContext) getContext();
        final UIImplementation uiImplementation = context.getNativeModule(UIManagerModule.class).getUIImplementation();
        final SparseIntArray tagsToRemove = new SparseIntArray();

        mPaths.removeAll(paths);

        for (int i = 0; i < getChildCount(); i++) {
            for (RCanvasPath path: paths) {
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
