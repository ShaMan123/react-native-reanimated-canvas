package com.autodidact.reanimatedcanvas;

import android.annotation.TargetApi;
import android.graphics.Picture;
import android.graphics.Region;
import android.graphics.Typeface;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewParent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;

import javax.annotation.Nullable;

public class RCanvas extends View {
    public final static String TAG = "RNSketchCanvas";

    private ArrayList<RCanvasPath> mPaths = new ArrayList<RCanvasPath>();
    private RCanvasPath mCurrentPath = null;

    private ThemedReactContext mContext;
    private boolean mDisableHardwareAccelerated = false;

    private int mOriginalWidth, mOriginalHeight;
    private Picture mBackgroundImage;
    private String mContentMode;

    private ArrayList<RCanvasText> mArrCanvasText = new ArrayList<RCanvasText>();
    private ArrayList<RCanvasText> mArrTextOnSketch = new ArrayList<RCanvasText>();
    private ArrayList<RCanvasText> mArrSketchOnText = new ArrayList<RCanvasText>();

    private float mTouchRadius = 0;
    private int mStrokeColor;
    private int mStrokeWidth;
    private TouchState mTouchState;
    private RCanvasEventHandler eventHandler;

    public RCanvas(ThemedReactContext context) {
        super(context);
        mContext = context;
        eventHandler = new RCanvasEventHandler(this);
    }

    public RCanvasEventHandler getEventHandler(){
        return eventHandler;
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return eventHandler.onTouchEvent(event);
    }

    public void setHardwareAccelerated(boolean useHardwareAccelerated) {
        mDisableHardwareAccelerated = !useHardwareAccelerated;
        if(useHardwareAccelerated) {
            setLayerType(View.LAYER_TYPE_HARDWARE, null);
        } else{
            setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
    }

    public void setStrokeColor(int color){
        mStrokeColor = color;
    }

    public void setStrokeWidth(int width){
        mStrokeWidth = width;
    }

    public TouchState getTouchState(){
        return mTouchState;
    }

    public void setTouchState(TouchState touchState){
        mTouchState = touchState;
        ViewParent parent = getParent();
        if(parent != null) {
            if (mTouchState.getState() == TouchState.NONE) {
                parent.requestDisallowInterceptTouchEvent(false);
            } else {
                parent.requestDisallowInterceptTouchEvent(true);
            }
        }
    }

    @Nullable public RCanvasPath getCurrentPath(){
        return mCurrentPath;
    }

    public RCanvasPath getPath(String id){
        for (RCanvasPath path: mPaths) {
            if (path.id.equals(id)) {
                return path;
            }
        }

        throw new JSApplicationIllegalArgumentException("SketchCanvas failed to find path with id + " + id);
    }

    public void setCurrentPath(String id){
        mCurrentPath = getPath(id);
    }

    public void setAttributes(String id, ReadableMap attributes) {
        RCanvasPath path = getPath(id);
        if (attributes.hasKey("color")) {
            path.strokeColor = attributes.getInt("color");
        }
        if (attributes.hasKey("width")) {
            path.strokeWidth = PixelUtil.toPixelFromDIP(attributes.getInt("width"));
        }
        invalidateCanvas(false);
    }

    public boolean openImageFile(String filename, String directory, String mode) {
        if(filename != null) {
            int res = mContext.getResources().getIdentifier(
                filename.lastIndexOf('.') == -1 ? filename : filename.substring(0, filename.lastIndexOf('.')), 
                "drawable", 
                mContext.getPackageName());
            BitmapFactory.Options bitmapOptions = new BitmapFactory.Options();
            Bitmap bitmap = res == 0 ? 
                BitmapFactory.decodeFile(new File(filename, directory == null ? "" : directory).toString(), bitmapOptions) :
                BitmapFactory.decodeResource(mContext.getResources(), res);
            if(bitmap != null) {
                Picture picture = new Picture();
                mOriginalHeight = bitmap.getHeight();
                mOriginalWidth = bitmap.getWidth();
                Canvas canvas = picture.beginRecording(mOriginalWidth, mOriginalHeight);
                canvas.drawBitmap(bitmap, 0, 0, null);
                picture.endRecording();

                mBackgroundImage = picture;
                mContentMode = mode;
                bitmap.recycle();

                invalidateCanvas(true);

                return true;
            }
        }
        return false;
    }

    public void setCanvasText(ReadableArray aText) {
        mArrCanvasText.clear();
        mArrSketchOnText.clear();
        mArrTextOnSketch.clear();

        if (aText != null) {
            for (int i=0; i<aText.size(); i++) {
                ReadableMap property = aText.getMap(i);
                if (property.hasKey("text")) {
                    String alignment = property.hasKey("alignment") ? property.getString("alignment") : "Left";
                    int lineOffset = 0, maxTextWidth = 0;
                    String[] lines = property.getString("text").split("\n");
                    ArrayList<RCanvasText> textSet = new ArrayList<RCanvasText>(lines.length);
                    for (String line: lines) {
                        ArrayList<RCanvasText> arr = property.hasKey("overlay") && "TextOnSketch".equals(property.getString("overlay")) ? mArrTextOnSketch : mArrSketchOnText;
                        RCanvasText text = new RCanvasText();
                        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
                        p.setTextAlign(Paint.Align.LEFT);
                        text.text = line;
                        if (property.hasKey("font")) {
                            Typeface font;
                            try {
                                font = Typeface.createFromAsset(mContext.getAssets(), property.getString("font"));
                            } catch(Exception ex) {
                                font = Typeface.create(property.getString("font"), Typeface.NORMAL);
                            }
                            p.setTypeface(font);
                        }
                        p.setTextSize(property.hasKey("fontSize") ? (float)property.getDouble("fontSize") : 12);
                        p.setColor(property.hasKey("fontColor") ? property.getInt("fontColor") : 0xFF000000);
                        text.anchor = property.hasKey("anchor") ? new PointF((float)property.getMap("anchor").getDouble("x"), (float)property.getMap("anchor").getDouble("y")) : new PointF(0, 0);
                        text.position = property.hasKey("position") ? new PointF((float)property.getMap("position").getDouble("x"), (float)property.getMap("position").getDouble("y")) : new PointF(0, 0);
                        text.paint = p;
                        text.isAbsoluteCoordinate = !(property.hasKey("coordinate") && "Ratio".equals(property.getString("coordinate")));
                        text.textBounds = new Rect();
                        p.getTextBounds(text.text, 0, text.text.length(), text.textBounds);

                        text.lineOffset = new PointF(0, lineOffset);
                        lineOffset += text.textBounds.height() * 1.5 * (property.hasKey("lineHeightMultiple") ? property.getDouble("lineHeightMultiple") : 1);
                        maxTextWidth = Math.max(maxTextWidth, text.textBounds.width());

                        arr.add(text);
                        mArrCanvasText.add(text);
                        textSet.add(text);
                    }
                    for(RCanvasText text: textSet) {
                        text.height = lineOffset;
                        if (text.textBounds.width() < maxTextWidth) {
                            float diff = maxTextWidth - text.textBounds.width();
                            text.textBounds.left += diff * text.anchor.x;
                            text.textBounds.right += diff * text.anchor.x;
                        }
                    }
                    if (getWidth() > 0 && getHeight() > 0) {
                        for(RCanvasText text: textSet) {
                            text.height = lineOffset;
                            PointF position = new PointF(text.position.x, text.position.y);
                            if (!text.isAbsoluteCoordinate) {
                                position.x *= getWidth();
                                position.y *= getHeight();
                            }
                            position.x -= text.textBounds.left;
                            position.y -= text.textBounds.top;
                            position.x -= (text.textBounds.width() * text.anchor.x);
                            position.y -= (text.height * text.anchor.y);
                            text.drawPosition = position;
                        }
                    }
                    if (lines.length > 1) {
                        for(RCanvasText text: textSet) {
                            switch(alignment) {
                                case "Left":
                                default:
                                    break;
                                case "Right":
                                    text.lineOffset.x = (maxTextWidth - text.textBounds.width());
                                    break;
                                case "Center":
                                    text.lineOffset.x = (maxTextWidth - text.textBounds.width()) / 2;
                                    break;
                            }
                        }
                    }
                }
            }
        }

        invalidateCanvas(false);
    }

    public void clear() {
        mPaths.clear();
        mCurrentPath = null;
        invalidateCanvas(true);
    }

    public void newPath() {
        newPath(Utility.generateId(), mStrokeColor, mStrokeWidth);
    }

    public void newPath(String id, int strokeColor, float strokeWidth) {
        mCurrentPath = new RCanvasPath(id, strokeColor, strokeWidth);
        mPaths.add(mCurrentPath);
        boolean isErase = strokeColor == Color.TRANSPARENT;
        if (isErase && mDisableHardwareAccelerated == false) {
            mDisableHardwareAccelerated = true;
            setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
        invalidateCanvas(true);
    }

    public void addPoint(float x, float y) {
        addPoint(new PointF(x, y));
    }

    public void addPoint(PointF point) {
        Rect updateRect = mCurrentPath.addPoint(point);
        invalidate();
    }

    public static ArrayList<PointF> parsePathCoords(ReadableArray coords){
        ArrayList<PointF> pointPath;
        pointPath = new ArrayList<PointF>(coords.size());
        for (int i=0; i<coords.size(); i++) {
            ReadableMap p = coords.getMap(i);
            pointPath.add(new PointF(PixelUtil.toPixelFromDIP(p.getDouble("x")), PixelUtil.toPixelFromDIP(p.getDouble("y"))));
        }
        return pointPath;
    }

    public void addPaths(@Nullable ReadableArray paths){
        for (int k = 0; k < paths.size(); k++){
            ReadableArray path = paths.getArray(k);
            addPath(path.getString(0), path.getInt(1), PixelUtil.toPixelFromDIP(path.getInt(2)), parsePathCoords(path.getArray(3)));
        }
        invalidateCanvas(true);
    }

    private void addPath(String id, int strokeColor, float strokeWidth, ArrayList<PointF> points) {
        boolean exist = false;
        for(RCanvasPath data: mPaths) {
            if (data.id == id) {
                exist = true;
                break;
            }
        }

        if (!exist) {
            RCanvasPath newPath = new RCanvasPath(id, strokeColor, strokeWidth, points);
            mPaths.add(newPath);
            boolean isErase = strokeColor == Color.TRANSPARENT;
            if (isErase && mDisableHardwareAccelerated == false) {
                mDisableHardwareAccelerated = true;
                setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            }
            invalidate();
        }
    }

    public void deletePath(String id) {
        int index = -1;

        for(int i = 0; i<mPaths.size(); i++) {
            if (id.equals(mPaths.get(i).id)) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            mPaths.remove(index);
            invalidateCanvas(true);
        }
    }

    public void end() {
        if (mCurrentPath != null) {
            mCurrentPath = null;
            invalidate();
        }
    }

    public void onSaved(boolean success, String path) {
        WritableMap event = Arguments.createMap();
        event.putBoolean("success", success);
        event.putString("path", path);
        eventHandler.emit(RCanvasEventHandler.ON_SKETCH_SAVED, event);
    }

    public void save(final String format, String folder, String filename, boolean transparent, boolean includeImage, boolean includeText, boolean cropToImageSize) {
        File f = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) + File.separator + folder);
        boolean success = f.exists() ? true : f.mkdirs();
        if (success) {
            final Bitmap bitmap = createImage(format.equals("png") && transparent, includeImage, includeText, cropToImageSize);

            final File file = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) +
                File.separator + folder + File.separator + filename + (format.equals("png") ? ".png" : ".jpg"));

            new Thread(new Runnable() {
                public void run() {
                    try {
                        bitmap.compress(
                                format.equals("png") ? Bitmap.CompressFormat.PNG : Bitmap.CompressFormat.JPEG,
                                format.equals("png") ? 100 : 90,
                                new FileOutputStream(file));
                        bitmap.recycle();
                        post(new Runnable() {
                            public void run() {
                                onSaved(true, file.getPath());
                            }
                        });
                    } catch (Exception e) {
                        e.printStackTrace();
                        post(new Runnable() {
                            public void run() {
                                onSaved(false, null);
                            }
                        });
                    }
                }
            }).start();
        } else {
            Log.e(RCanvas.TAG, "SketchCanvas: Failed to create folder!");
            onSaved(false, null);
        }
    }

    public void getBase64(final String format, boolean transparent, boolean includeImage, boolean includeText, boolean cropToImageSize, final Callback callback) {
        WritableMap event = Arguments.createMap();
        final Bitmap bitmap = createImage(format.equals("png") && transparent, includeImage, includeText, cropToImageSize);
        final ByteArrayOutputStream byteArrayOS = new ByteArrayOutputStream();

        new Thread(new Runnable() {
            public void run() {
                bitmap.compress(
                        format.equals("png") ? Bitmap.CompressFormat.PNG : Bitmap.CompressFormat.JPEG,
                        format.equals("png") ? 100 : 90,
                        byteArrayOS);
                bitmap.recycle();
                post(new Runnable() {
                    public void run() {
                        String base64 = Base64.encodeToString(byteArrayOS.toByteArray(), Base64.DEFAULT);
                        callback.invoke(null, base64);
                    }
                });
            }
        }).start();
    }

    @Override
    protected void onSizeChanged(final int w, final int h, final int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        if (getWidth() > 0 && getHeight() > 0 && (w != oldw || h != oldh)) {
            for(RCanvasText text: mArrCanvasText) {
                PointF position = new PointF(text.position.x, text.position.y);
                if (!text.isAbsoluteCoordinate) {
                    position.x *= getWidth();
                    position.y *= getHeight();
                }

                position.x -= text.textBounds.left;
                position.y -= text.textBounds.top;
                position.x -= (text.textBounds.width() * text.anchor.x);
                position.y -= (text.height * text.anchor.y);
                text.drawPosition = position;

            }
            invalidate();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        drawOnCanvas(canvas);
    }

    private Canvas drawOnCanvas(Canvas canvas){
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.MULTIPLY);

        if (mBackgroundImage != null) {
            Rect dstRect = new Rect();
            canvas.getClipBounds(dstRect);
            Utility.fillImage(mBackgroundImage.getWidth(), mBackgroundImage.getHeight(), dstRect.width(), dstRect.height(), mContentMode).roundOut(dstRect);
            canvas.drawPicture(mBackgroundImage, dstRect);
        }

        for(RCanvasText text: mArrSketchOnText) {
            canvas.drawText(text.text, text.drawPosition.x + text.lineOffset.x, text.drawPosition.y + text.lineOffset.y, text.paint);
        }

        for(RCanvasPath path: mPaths) {
            path.draw(canvas);
        }

        for(RCanvasText text: mArrTextOnSketch) {
            canvas.drawText(text.text, text.drawPosition.x + text.lineOffset.x, text.drawPosition.y + text.lineOffset.y, text.paint);
        }

        return canvas;
    }

    private void invalidateCanvas(boolean shouldDispatchEvent) {
        if (shouldDispatchEvent) {
            WritableMap event = Arguments.createMap();
            event.putInt("pathsUpdate", mPaths.size());
            eventHandler.emit(RCanvasEventHandler.PATHS_UPDATE, event);
        }
        invalidate();
    }

    private Bitmap createImage(boolean transparent, boolean includeImage, boolean includeText, boolean cropToImageSize) {
        Bitmap bitmap = Bitmap.createBitmap(
            mBackgroundImage != null && cropToImageSize ? mOriginalWidth : getWidth(),
            mBackgroundImage != null && cropToImageSize ? mOriginalHeight : getHeight(), 
            Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawARGB(transparent ? 0 : 255, 255, 255, 255);
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.MULTIPLY);

        if (mBackgroundImage != null && includeImage) {
            Rect targetRect = new Rect();
            if(cropToImageSize){
                Utility.fillImage(mBackgroundImage.getWidth(), mBackgroundImage.getHeight(),
                        bitmap.getWidth(), bitmap.getHeight(), "AspectFit").roundOut(targetRect);
            }
            else{
                Utility.fillImage(mBackgroundImage.getWidth(), mBackgroundImage.getHeight(), bitmap.getWidth(), bitmap.getHeight(), mContentMode).roundOut(targetRect);
            }
            canvas.drawPicture(mBackgroundImage, targetRect);

        }

        if (includeText) {
            for(RCanvasText text: mArrSketchOnText) {
                canvas.drawText(text.text, text.drawPosition.x + text.lineOffset.x, text.drawPosition.y + text.lineOffset.y, text.paint);
            }
        }

        for(RCanvasPath path: mPaths) {
            path.draw(canvas);
        }

        if (includeText) {
            for(RCanvasText text: mArrTextOnSketch) {
                canvas.drawText(text.text, text.drawPosition.x + text.lineOffset.x, text.drawPosition.y + text.lineOffset.y, text.paint);
            }
        }

        return bitmap;
    }

    private int getPathIndex(String pathId){
        for (int i=0; i < mPaths.size(); i++) {
            if(pathId == mPaths.get(i).id) {
                return i;
            }
        }
        return -1;
    }

    @TargetApi(19)
    private Region getRegion(){
        return new Region(getLeft(), getTop(), getRight(), getBottom());
    }

    public void setTouchRadius(int value){
        mTouchRadius = ((float) value);
    }
    public void setTouchRadius(float value){
        mTouchRadius = value;
    }

    public float getTouchRadius(){
        return mTouchRadius;
    }
    public float getTouchRadius(float strokeWidth){
        return mTouchRadius <= 0 && strokeWidth > 0? (strokeWidth * 0.5f): mTouchRadius;
    }

    @TargetApi(19)
    public boolean isPointUnderTransparentPath(float x, float y, String pathId){
        int beginAt = Math.min(getPathIndex(pathId) + 1, mPaths.size() - 1);
        for (int i = getPathIndex(pathId); i < mPaths.size(); i++){
            RCanvasPath mPath = mPaths.get(i);
            if(mPath.isPointOnPath(x, y, getTouchRadius(mPath.strokeWidth), getRegion()) && mPath.strokeColor == Color.TRANSPARENT) {
                return true;
            }
        }
        return false;
    }

    @TargetApi(19)
    public boolean isPointOnPath(float x, float y, String pathId){
        if(isPointUnderTransparentPath(x, y, pathId)) {
            return false;
        }
        else {
            RCanvasPath mPath = mPaths.get(getPathIndex(pathId));
            return mPath.isPointOnPath(x, y, getTouchRadius(mPath.strokeWidth), getRegion());
        }
    }

    @TargetApi(19)
    public WritableArray isPointOnPath(float x, float y){
        WritableArray array = Arguments.createArray();
        Region mRegion = getRegion();
        float r;

        for(RCanvasPath mPath: mPaths) {
            r = getTouchRadius(mPath.strokeWidth);
            if(mPath.isPointOnPath(x, y, r, mRegion) && !isPointUnderTransparentPath(x, y, mPath.id)){
                array.pushString(mPath.id);
            }
        }

        return array;
    }

    public void tearDown(){

    }
}
