package com.facebook.react.uimanager;

public class UIManagerCanvasHelper {
  public static ViewManager resolveViewManager(UIImplementation uiImplementation, String className) {
    return uiImplementation.resolveViewManager(className);
  }

  public static ShadowNodeRegistry getShadowNodeRegistry(UIImplementation uiImplementation) {
    return uiImplementation.mShadowNodeRegistry;
  }

  public static void stubShadowNodeRegistry(UIImplementation uiImplementation, ReactShadowNode nodeToStub) {
    ReactShadowNodeImpl stub = new ReactShadowNodeImpl();
    stub.setReactTag(nodeToStub.getReactTag());
    stub.setViewClassName(nodeToStub.getViewClass());
    stub.setRootTag(nodeToStub.getRootTag());
    stub.setThemedContext(nodeToStub.getThemedContext());
    stub.setIsLayoutOnly(true);
    getShadowNodeRegistry(uiImplementation).addNode(stub);
  }

}
