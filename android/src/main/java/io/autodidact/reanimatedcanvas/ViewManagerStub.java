package io.autodidact.reanimatedcanvas;

import android.view.View;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

class ViewManagerStub extends SimpleViewManager<View> {

    final static String NAME = "ViewManagerStub";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @NonNull
    @Override
    protected View createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new View(reactContext);
    }

    @Override
    public void updateProperties(@NonNull View viewToUpdate, ReactStylesDiffMap props) {

    }

    static ReactShadowNode stubShadowNode(ReactShadowNode nodeToStub) {
        ReactShadowNodeImpl stub = new ReactShadowNodeImpl();
        stub.setReactTag(nodeToStub.getReactTag());
        stub.setViewClassName(NAME);
        stub.setRootTag(nodeToStub.getRootTag());
        stub.setThemedContext(nodeToStub.getThemedContext());
        stub.setIsLayoutOnly(true);
        return stub;
    }
}