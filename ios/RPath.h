
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol RPathDataP <NSObject>

@property (nonatomic) int pathId;
@property (nonatomic) CGFloat strokeWidth;
@property (nonatomic) UIColor *strokeColor;
@property (nonatomic) NSMutableArray<NSValue*> *points;

@end

@interface RPath : UIView <RPathDataP>

@property (nonatomic, readonly) int pathId;
@property (nonatomic, readonly) CGFloat strokeWidth;
@property (nonatomic, readonly) UIColor *strokeColor;
@property (nonatomic, readonly) NSMutableArray<NSValue*> *points;
@property (nonatomic, readonly) BOOL isTranslucent;

- (instancetype)init;
- (instancetype)initWithId:(int) pathId strokeColor:(UIColor*) strokeColor strokeWidth:(int) strokeWidth;
- (instancetype)initWithId:(int) pathId strokeColor:(UIColor*) strokeColor strokeWidth:(int) strokeWidth points: (NSArray*) points;

- (void)setStrokeColor:(UIColor *)color;
- (CGRect)addPoint:(CGPoint) point;

- (void)drawLastPointInContext:(CGContextRef)context;
- (void)drawInContext:(CGContextRef)context;
- (UIBezierPath*)evaluatePath;

@end
