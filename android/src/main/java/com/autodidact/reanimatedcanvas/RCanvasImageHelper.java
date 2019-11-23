package com.autodidact.reanimatedcanvas;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Picture;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactContext;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;

public class RCanvasImageHelper {
    private int mOriginalWidth, mOriginalHeight;
    private Picture mBackgroundImage;
    private String mContentMode;
    private final RCanvas mView;
    private final ReactContext mContext;

    public RCanvasImageHelper(RCanvas view) {
        mView = view;
        mContext = ((ReactContext) view.getContext());
    }

    private void post(Runnable action) {
        mView.post(action);
    }

    private int getWidth(){
        return mView.getWidth();
    }

    private int getHeight(){
        return mView.getHeight();
    }

    private void emitSaveCanvas(boolean success, String path){
        mView.getEventHandler().emitSaveCanvas(success, path);
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

                mView.invalidate();

                return true;
            }
        }
        return false;
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

        mView.drawOnCanvas(canvas, false, includeText);

        return bitmap;
    }

    public void save(final String format, String folder, String filename, boolean transparent, boolean includeImage, boolean includeText, boolean cropToImageSize) {
        File f = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) + File.separator + folder);
        boolean success = f.exists() || f.mkdirs();
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
                                emitSaveCanvas(true, file.getPath());
                            }
                        });
                    } catch (Exception e) {
                        e.printStackTrace();
                        post(new Runnable() {
                            public void run() {
                                emitSaveCanvas(false, null);
                            }
                        });
                    }
                }
            }).start();
        } else {
            Log.e(RCanvas.TAG, "RCanvas: Failed to create folder!");
            emitSaveCanvas(false, null);
        }
    }

    public void getBase64(final String format, boolean transparent, boolean includeImage, boolean includeText, boolean cropToImageSize, final Callback callback) {
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

    protected void draw(Canvas canvas) {
        if (mBackgroundImage != null) {
            Rect dstRect = new Rect();
            canvas.getClipBounds(dstRect);
            Utility.fillImage(mBackgroundImage.getWidth(), mBackgroundImage.getHeight(), dstRect.width(), dstRect.height(), mContentMode).roundOut(dstRect);
            canvas.drawPicture(mBackgroundImage, dstRect);
        }
    }
}
