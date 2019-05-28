package com.terrylinla.rnsketchcanvas;

public class TouchState {
    public static final int DRAW = 0;
    public static final int TOUCH = 1;
    public static final int NONE = -1;

    public final static String STATE_DRAW = "draw";
    public final static String STATE_TOUCH = "touch";
    public final static String STATE_NONE = "none";

    private int mState;

    public TouchState(boolean touchEnabled){
        mState = fromBoolean(touchEnabled);
    }
    public TouchState(String touchState){
        mState = fromString(touchState);
    }
    public TouchState(int touchState){
        mState = validate(touchState);
    }

    public int getState(){
        return mState;
    }

    public boolean canDraw() {
        return canDraw(mState);
    }

    public boolean canTouch() {
        return canTouch(mState);
    }

    public static boolean canDraw(int state){
        return state == TouchState.DRAW;
    }

    public static boolean canTouch(int state){
        return state != TouchState.NONE;
    }

    public static int fromBoolean(boolean touchEnabled){
        return touchEnabled? DRAW: TOUCH;
    }

    public static int fromString(String touchState){
        switch (touchState){
            case STATE_DRAW: return DRAW;
            case STATE_TOUCH: return TOUCH;
            case STATE_NONE: return NONE;
            default:
                IllegalArgumentException err = new IllegalArgumentException("illegal touchState");
                err.printStackTrace();
                throw err;
        }
    }

    public static int validate(int state){
        switch (state){
            case DRAW | TOUCH | NONE: break;
            default:
                IllegalArgumentException err = new IllegalArgumentException("illegal touchState");
                err.printStackTrace();
                throw err;
        }
        return state;
    }
}
