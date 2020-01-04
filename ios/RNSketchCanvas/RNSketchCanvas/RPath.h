
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface RPath : UIView

@property (nonatomic, readonly) int pathId;
@property (nonatomic, readonly) CGFloat strokeWidth;
@property (nonatomic, readonly) UIColor* strokeColor;
@property (nonatomic, readonly) NSArray<NSValue*> *points;
@property (nonatomic, readonly) BOOL isTranslucent;

- (instancetype)init;
- (instancetype)initWithId:(int) pathId strokeColor:(UIColor*) strokeColor strokeWidth:(int) strokeWidth;
- (instancetype)initWithId:(int) pathId strokeColor:(UIColor*) strokeColor strokeWidth:(int) strokeWidth points: (NSArray*) points;

- (CGRect)addPoint:(CGPoint) point;

- (void)drawLastPointInContext:(CGContextRef)context;
- (void)drawInContext:(CGContextRef)context;
- (UIBezierPath*)getPath;
- (UIBezierPath*)evaluatePath;

@end
