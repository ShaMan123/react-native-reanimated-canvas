#import "RCanvasManager.h"
#import "RCanvas.h"
#import "RPath.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTView.h>
#import <React/UIView+React.h>
#import "Utility.h"

@implementation RCanvas
{
    RCTEventDispatcher *_eventDispatcher;

    CGSize _lastSize;

    CGContextRef _drawingContext, _translucentDrawingContext;
    CGImageRef _frozenImage, _translucentFrozenImage;
    BOOL _needsFullRedraw;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
    self = [super init];
    if (self) {
        _eventDispatcher = eventDispatcher;
        _needsFullRedraw = YES;
        self.paths = [NSMutableArray new];

        self.backgroundColor = [UIColor clearColor];
        self.clearsContextBeforeDrawing = YES;
    }
    return self;
}
/*
- (void)drawRect:(CGRect)rect {
    CGContextRef context = UIGraphicsGetCurrentContext();

    CGRect bounds = self.bounds;

    if (_needsFullRedraw) {
        [self setFrozenImageNeedsUpdate];
        CGContextClearRect(_drawingContext, bounds);
        for (RPath *path in self.paths) {
            [path drawInContext:_drawingContext];
        }
        _needsFullRedraw = NO;
    }

    if (!_frozenImage) {
        _frozenImage = CGBitmapContextCreateImage(_drawingContext);
    }
    
    if (!_translucentFrozenImage && _currentPath.isTranslucent) {
        _translucentFrozenImage = CGBitmapContextCreateImage(_translucentDrawingContext);
    }

    if (_frozenImage) {
        CGContextDrawImage(context, bounds, _frozenImage);
    }

    if (_translucentFrozenImage && _currentPath.isTranslucent) {
        CGContextDrawImage(context, bounds, _translucentFrozenImage);
    }

}
*/
- (void)layoutSubviews {
    [super layoutSubviews];

    if (!CGSizeEqualToSize(self.bounds.size, _lastSize)) {
        _lastSize = self.bounds.size;
        CGContextRelease(_drawingContext);
        _drawingContext = nil;
        [self createDrawingContext];
        _needsFullRedraw = YES;

        [self setNeedsDisplay];
    }
}

- (void)createDrawingContext {
    CGFloat scale = self.window.screen.scale;
    CGSize size = self.bounds.size;
    size.width *= scale;
    size.height *= scale;
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    _drawingContext = CGBitmapContextCreate(nil, size.width, size.height, 8, 0, colorSpace, kCGImageAlphaPremultipliedLast);
    _translucentDrawingContext = CGBitmapContextCreate(nil, size.width, size.height, 8, 0, colorSpace, kCGImageAlphaPremultipliedLast);
    CGColorSpaceRelease(colorSpace);

    CGContextConcatCTM(_drawingContext, CGAffineTransformMakeScale(scale, scale));
    CGContextConcatCTM(_translucentDrawingContext, CGAffineTransformMakeScale(scale, scale));
}

- (void)setFrozenImageNeedsUpdate {
    CGImageRelease(_frozenImage);
    CGImageRelease(_translucentFrozenImage);
    _frozenImage = nil;
    _translucentFrozenImage = nil;
}

- (int)getIndex:(RPath *)path {
    for (int i = 0; i < self.paths.count; i++) {
        if (((RPath*)self.paths[i]).pathId == path.pathId) {
            return i;
        }
    }
    return -1;
}

- (int)getIndexForId:(int)pathId {
    for (int i = 0; i < self.paths.count; i++) {
        if (((RPath*)self.paths[i]).pathId == pathId) {
            return i;
        }
    }
    return -1;
}

- (RPath *)getPath:(int)pathId {
    int i = [self getIndexForId:pathId];
    return i == -1 ? nil :self.paths[i];
}

- (NSArray<RPath *> *)getPaths:(NSArray<NSNumber *> *)pathIDArray {
    NSMutableArray *pathsToReturn = [NSMutableArray new];
    for (NSNumber *pathId in pathIDArray) {
        [pathsToReturn addObject:[self getPath:[pathId intValue]]];
    }
    return pathsToReturn;
}

- (BOOL)hasPath:(int)pathId {
    int i = [self getIndexForId:pathId];
    return i != -1;
}

- (void)addPath:(RPath *)path {
    [self.paths addObject:path];
    //[path drawInContext:_drawingContext];
    [self addSubview:path];
}

- (void)removePath:(RPath *)path {
    [self.paths removeObject:path];
    [self willRemoveSubview:path];
}

- (void) addPaths:(NSArray<RPath *> *)paths {
    BOOL invalidate = NO;
    for (RPath *path in paths) {
        if ([self hasPath:path.pathId]) {
            @throw @"Path id taken";
        } else {
            [self addPath:path];
            invalidate = YES;
        }
    }
    if (invalidate) {
        _needsFullRedraw = YES;
        [self setFrozenImageNeedsUpdate];
        [self setNeedsDisplay];
        //[self notifyPathsUpdate];
    }
}

- (void)deletePaths:(NSArray<RPath *> *)paths {
    BOOL invalidate = NO;
    for (RPath *path in paths) {
        [self removePath:path];
        invalidate = YES;
    }
    
    if (invalidate) {
        _needsFullRedraw = YES;
        [self setNeedsDisplay];
        //[self notifyPathsUpdate];
    }
}

- (void)allocPath:(int)pathId strokeColor:(UIColor *)strokeColor strokeWidth:(int)strokeWidth {
    RPath *path = [[RPath alloc]
                   initWithId: pathId
                   strokeColor: strokeColor
                   strokeWidth: strokeWidth];
    [self addPath:path];
}

- (void)drawPoint:(CGPoint)point pathId:(int)pathId {
    RPath * path = [self getPath:pathId];
    CGRect updateRect = [path addPoint: point];
    
    if (path.isTranslucent) {
        CGContextClearRect(_translucentDrawingContext, self.bounds);
        [path drawInContext:_translucentDrawingContext];
    } else {
        [path drawLastPointInContext:_drawingContext];
    }
    
    [self setFrozenImageNeedsUpdate];
    [self setNeedsDisplayInRect:updateRect];
}

- (void)endPath:(int)pathId {
    RPath * path = [self getPath:pathId];
    if (path.isTranslucent) {
        [path drawInContext:_drawingContext];
    }
}

- (void) clear {
    [self deletePaths:self.paths];
}

- (void)notifyPathsUpdate {
    /*
    if (_onChange) {
        _onChange(@{ @"pathsUpdate": @(self.paths.count) });
    }
     */
}

@end
