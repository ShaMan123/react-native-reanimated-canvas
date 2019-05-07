package com.terrylinla.rnsketchcanvas;

import android.graphics.BitmapFactory;
import android.util.Log;
import android.graphics.RectF;


public final class Utility {
    public static RectF fillImage(float imgWidth, float imgHeight, float targetWidth, float targetHeight, String mode) {
        //float fitToMaxScale = Math.min(Math.min(maxSize / imgWidth, 1), Math.min(maxSize / imgHeight, 1));
        float boundImgWidth = imgWidth;// * fitToMaxScale;
        float boundImgHeight = imgHeight;// * fitToMaxScale;
        float imageAspectRatio = imgWidth / imgHeight;
        float targetAspectRatio = targetWidth / targetHeight;

        switch (mode) {
            case "AspectFill": {
                float scaleFactor = targetAspectRatio < imageAspectRatio ? targetHeight / boundImgHeight : targetWidth / boundImgWidth;
                float w = boundImgWidth * scaleFactor, h = boundImgHeight * scaleFactor;
                return new RectF((targetWidth - w) / 2, (targetHeight - h) / 2, 
                    w + (targetWidth - w) / 2, h + (targetHeight - h) / 2);
            }
            case "AspectFit":
            default: {
                float scaleFactor = targetAspectRatio > imageAspectRatio ? targetHeight / boundImgHeight : targetWidth / boundImgWidth;
                float w = boundImgWidth * scaleFactor, h = boundImgHeight * scaleFactor;
                return new RectF((targetWidth - w) / 2, (targetHeight - h) / 2, 
                    w + (targetWidth - w) / 2, h + (targetHeight - h) / 2);
            }
            case "ScaleToFill": {
                return  new RectF(0, 0, targetWidth, targetHeight);
            }
        }
    }

    public static int calculateInSampleSize(BitmapFactory.Options options, float targetWidth, float targetHeight) {
        int inSampleSize = 1;
        final int imgHeight = options.outHeight;
        final int imgWidth = options.outWidth;

        if (imgHeight > targetHeight || imgWidth > targetWidth) {

            final float halfHeight = imgHeight / 2;
            final float halfWidth = imgWidth / 2;

            // Calculate the largest inSampleSize value that is a power of 2 and keeps both
            // height and width larger than the requested height and width.
            while ((halfHeight / inSampleSize) >= targetHeight
                    && (halfWidth / inSampleSize) >= targetWidth) {
                inSampleSize *= 2;
            }
        }

        return inSampleSize;
    }
}