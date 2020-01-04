#import "PathIntersectionHelper.h"
#import "RPath.h"

@implementation PathIntersectionHelper

+ (NSArray<NSNumber *> *)isPointOnPath:(CGPoint)point paths:(NSArray<RPath *> *)paths {
    NSArray *response = [self intersect:point paths:paths];
    NSMutableArray *retVal = [[NSMutableArray alloc] init];
    
    for (RPath *path in response) {
        if (![path isTranslucent]) {
            [retVal addObject:path];
        } else {
            [retVal removeAllObjects];
        }
    }
    
    return (NSArray*)retVal;
}

+ (NSMutableArray<NSNumber *> *)intersect: (CGPoint)point paths:(NSArray<RPath *> *)paths {
    NSMutableArray *response = [[NSMutableArray alloc] init];
    
    for (RPath *path in paths) {
        BOOL containsPoint = [self containsPoint:point onPath:path inFillArea:NO];
        if(containsPoint) {
            [response addObject:[NSNumber numberWithInt:path.pathId]];
        }
    }
    
    return response;
}

+ (BOOL)containsPoint:(CGPoint)point onPath:(RPath *)path inFillArea:(BOOL)inFill
{
    //  see this article: https://oleb.net/blog/2012/02/cgpath-hit-testing/
    
    CGContextRef context = UIGraphicsGetCurrentContext();
    UIBezierPath *_path = [path evaluatePath];
    UIBezierPath *contour = [self tapTargetForPath:_path];
    
    BOOL    isHit = NO;
    
    CGContextSaveGState(context);
    CGContextAddPath(context, contour.CGPath);
    isHit = CGPathContainsPoint(contour.CGPath, nil, point, false);
    CGContextRestoreGState(context);
    
    return isHit;
}

+ (UIBezierPath *)tapTargetForPath:(UIBezierPath *)path
{
    if (path == nil) {
        return nil;
    }
    
    CGPathRef tapTargetPath = CGPathCreateCopyByStrokingPath(path.CGPath, NULL, fmaxf(35.0f, path.lineWidth), path.lineCapStyle, path.lineJoinStyle, path.miterLimit);
    if (tapTargetPath == NULL) {
        return nil;
    }
    
    UIBezierPath *tapTarget = [UIBezierPath bezierPathWithCGPath:tapTargetPath];
    CGPathRelease(tapTargetPath);
    return tapTarget;
}

+ (CGPathDrawingMode)getFillMode:(UIBezierPath *)path inFillArea:(BOOL)inFill
{
    CGPathDrawingMode mode = kCGPathStroke;
    if (inFill)
    {
        if (path.usesEvenOddFillRule)
            mode = kCGPathEOFill;
        else
            mode = kCGPathFill;
    }
    
    return mode;
}

@end
