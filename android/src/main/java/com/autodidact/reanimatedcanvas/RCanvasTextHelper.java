package com.autodidact.reanimatedcanvas;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.Rect;
import android.graphics.Typeface;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.ArrayList;

public class RCanvasTextHelper {
    private ArrayList<RCanvasText> mArrCanvasText = new ArrayList<RCanvasText>();
    private ArrayList<RCanvasText> mArrForegroundText = new ArrayList<RCanvasText>();
    private ArrayList<RCanvasText> mArrBackgroundText = new ArrayList<RCanvasText>();
    private final RCanvas mView;

    public RCanvasTextHelper(RCanvas view) {
        mView = view;
    }

    private int getWidth(){
        return mView.getWidth();
    }

    private int getHeight(){
        return mView.getHeight();
    }

    private void invalidate() {
        mView.invalidate();
    }

    public void setText(ReadableArray aText) {
        mArrCanvasText.clear();
        mArrBackgroundText.clear();
        mArrForegroundText.clear();

        int width = getWidth();
        int height = getHeight();

        if (aText != null) {
            for (int i=0; i<aText.size(); i++) {
                ReadableMap property = aText.getMap(i);
                if (property.hasKey("text")) {
                    String alignment = property.hasKey("alignment") ? property.getString("alignment") : "Left";
                    int lineOffset = 0, maxTextWidth = 0;
                    String[] lines = property.getString("text").split("\n");
                    ArrayList<RCanvasText> textSet = new ArrayList<RCanvasText>(lines.length);
                    for (String line: lines) {
                        ArrayList<RCanvasText> arr = property.hasKey("overlay") && "TextOnSketch".equals(property.getString("overlay")) ? mArrForegroundText : mArrBackgroundText;
                        RCanvasText text = new RCanvasText();
                        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
                        p.setTextAlign(Paint.Align.LEFT);
                        text.text = line;
                        if (property.hasKey("font")) {
                            Typeface font;
                            try {
                                font = Typeface.createFromAsset(mView.getContext().getAssets(), property.getString("font"));
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
                    if (width > 0 && height > 0) {
                        for(RCanvasText text: textSet) {
                            text.height = lineOffset;
                            PointF position = new PointF(text.position.x, text.position.y);
                            if (!text.isAbsoluteCoordinate) {
                                position.x *= width;
                                position.y *= height;
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

        invalidate();
    }

    protected void position() {
        position(getWidth(), getHeight());
    }

    protected void position(final int width, final int height) {
        for(RCanvasText text: mArrCanvasText) {
            PointF position = new PointF(text.position.x, text.position.y);
            if (!text.isAbsoluteCoordinate) {
                position.x *= width;
                position.y *= height;
            }

            position.x -= text.textBounds.left;
            position.y -= text.textBounds.top;
            position.x -= (text.textBounds.width() * text.anchor.x);
            position.y -= (text.height * text.anchor.y);
            text.drawPosition = position;
        }

        invalidate();
    }

    protected void drawBackground(Canvas canvas) {
        for(RCanvasText text: mArrBackgroundText) {
            canvas.drawText(text.text, text.drawPosition.x + text.lineOffset.x, text.drawPosition.y + text.lineOffset.y, text.paint);
        }
    }

    protected void drawForeground(Canvas canvas) {
        for(RCanvasText text: mArrForegroundText) {
            canvas.drawText(text.text, text.drawPosition.x + text.lineOffset.x, text.drawPosition.y + text.lineOffset.y, text.paint);
        }
    }
}
