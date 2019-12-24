package io.autodidact.reanimatedcanvas;

import android.graphics.PointF;
import android.view.ViewGroup;
import android.view.ViewParent;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;

import java.util.ArrayList;

public class RPathHandler extends RPath {

    private boolean mReceivedPoints = false;
    private boolean mShouldAnimatePath = false;
    private boolean mDidUpdate = false;

    RPathHandler(ReactContext context) {
        super(context);
    }

    @Override
    public void setStrokeColor(int color) {
        super.setStrokeColor(color);
        mDidUpdate = true;
    }

    @Override
    public void setStrokeWidth(float width) {
        super.setStrokeWidth(width);
        mDidUpdate = true;
    }

    public void preCommitPoints(@Nullable ArrayList<PointF> points) {
        mTempPoints = points;
        if (points != null) {
            mReceivedPoints = true;
            mDidUpdate = true;
        }
    }

    private void commitPoints() {
        if (mTempPoints != null) {
            setPoints(mTempPoints);
            mTempPoints = null;
        }
    }

    public void shouldAnimatePath(Boolean animate) {
        mShouldAnimatePath = animate;
    }

    public void commitPoint(int index) {
        if (mTempPoints != null) {
            UiThreadUtil.assertOnUiThread();
            addPoint(mTempPoints.get(index));
            if (getParent() != null) {
                ((ViewGroup) getParent()).postInvalidateOnAnimation();
            }
            if (index == mTempPoints.size() - 1) {
                mTempPoints = null;
                mShouldAnimatePath = false;
            }
        }
    }

    public void onAfterUpdateTransaction() {
        if (mPathId == null) {
            mPathId = Utility.generateId();
        }
        
        if (mReceivedPoints) {
            mReceivedPoints = false;
            if (!mShouldAnimatePath) {
                commitPoints();
            }
        }
        
        if (mDidUpdate) {
            mDidUpdate = false;
            ViewParent parent = getParent();
            if (parent instanceof RCanvasHandler) {
                ((RCanvasHandler) parent).finalizeUpdate(this);
            }
        }
    }
}
