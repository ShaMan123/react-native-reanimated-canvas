package io.autodidact.reanimatedcanvas;

import android.graphics.Path;
import android.graphics.PointF;

import java.util.ArrayList;

class PathUtil {

    static Path obtain(ArrayList<PointF> points) {
        int pointsCount = points.size();
        Path path = new Path();

        for(int i = 0; i < pointsCount; i++) {
            if (pointsCount >= 3 && i >= 2) {
                PointF a = points.get(i - 2);
                PointF b = points.get(i - 1);
                PointF c = points.get(i);
                PointF prevMid = midPoint(a, b);
                PointF currentMid = midPoint(b, c);

                // Draw a curve
                path.moveTo(prevMid.x, prevMid.y);
                path.quadTo(b.x, b.y, currentMid.x, currentMid.y);
            } else if (pointsCount >= 2 && i >= 1) {
                PointF a = points.get(i - 1);
                PointF b = points.get(i);
                PointF mid = midPoint(a, b);

                // Draw a line to the middle of points a and b
                // This is so the next draw which uses a curve looks correct and continues from there
                path.moveTo(a.x, a.y);
                path.lineTo(mid.x, mid.y);
            } else {
                PointF a = points.get(i);

                // Draw a single point
                path.moveTo(a.x, a.y);
                path.lineTo(a.x, a.y);
            }
        }
        return path;
    }

    static PointF midPoint(PointF p1, PointF p2) {
        return new PointF((p1.x + p2.x) * 0.5f, (p1.y + p2.y) * 0.5f);
    }

    static void addLastPoint(Path path, ArrayList<PointF> points) {
        int pointsCount = points.size();
        PointF p = points.get(pointsCount - 1);

        if (pointsCount >= 3) {
            addPointToPath(path,
                    points.get(pointsCount - 3),
                    points.get(pointsCount - 2),
                    p);
        } else if (pointsCount >= 2) {
            addPointToPath(path, points.get(0), points.get(0), p);
        } else {
            addPointToPath(path, p, p, p);
        }
    }

    static void addPointToPath(Path path, PointF tPoint, PointF pPoint, PointF point) {
        PointF mid1 = new PointF((pPoint.x + tPoint.x) * 0.5f, (pPoint.y + tPoint.y) * 0.5f);
        PointF mid2 = new PointF((point.x + pPoint.x) * 0.5f, (point.y + pPoint.y) * 0.5f);
        path.moveTo(mid1.x, mid1.y);
        path.quadTo(pPoint.x, pPoint.y, mid2.x, mid2.y);
    }
}
