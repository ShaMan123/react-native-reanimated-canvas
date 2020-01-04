

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

CGPoint midPoint (CGPoint p1, CGPoint p2);

@interface Utility : NSObject

+ (void)addPointToPath: (UIBezierPath*)path
               toPoint: (CGPoint)point
         tertiaryPoint: (CGPoint)tPoint
         previousPoint: (CGPoint) pPoint;
+ (BOOL)isSameColor:(UIColor *)color1 color:(UIColor *)color2;
+ (CGRect)fillImageWithSize:(CGSize)imgSize toSize:(CGSize)targetSize contentMode:(NSString*)mode;

@end
