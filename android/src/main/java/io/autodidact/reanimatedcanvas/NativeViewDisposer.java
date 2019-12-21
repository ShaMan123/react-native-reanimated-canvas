package io.autodidact.reanimatedcanvas;

import android.view.View;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.views.view.ReactViewManager;

import java.util.ArrayList;

public class NativeViewDisposer extends ReactViewManager {
    public static final String NAME = "NativeViewDisposer";

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public LayoutShadowNode createShadowNodeInstance() {
        return new SmartShadowNode();
    }

    @NonNull
    @Override
    public LayoutShadowNode createShadowNodeInstance(@NonNull ReactApplicationContext context) {
        return new SmartShadowNode();
    }

    @Override
    public Class<? extends LayoutShadowNode> getShadowNodeClass() {
        return SmartShadowNode.class;
    }

    public static class SmartShadowNode extends LayoutShadowNode {

        private ArrayList<Integer> blacklist = new ArrayList<>();

        @Override
        public void addChildAt(ReactShadowNodeImpl child, int i) {
            super.addChildAt(child, resolveIndex(i));
        }

        @Override
        public ReactShadowNodeImpl removeChildAt(int i) {
            return super.removeChildAt(resolveIndex(i));
        }

        private int resolveIndex(int index) {
            int realIndex = 0;
            for (int i = 0; i <= Math.min(index, getChildCount() -1); i++) {
                if (blacklist.indexOf(super.getChildAt(i).getReactTag()) == -1) {
                    realIndex++;
                }
            }
            return realIndex;
        }

        void blackListViews(final ArrayList<? extends View> views) {
            getThemedContext().assertOnNativeModulesQueueThread();
            ReactShadowNodeImpl childNode;

            for (View view: views) {
                blacklist.add(view.getId());
            }

            for (View view: views) {
                for (int i = 0; i < getChildCount(); i++) {
                    childNode = SmartShadowNode.super.getChildAt(i);
                    if (childNode.getReactTag() == view.getId()) {
                        childNode.setIsLayoutOnly(true);
                        SmartShadowNode.super.removeChildAt(i);
                        break;
                    }
                }
            }
        }
    }

}
