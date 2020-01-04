#import <React/RCTConvert.h>
#import "RCanvas.h"

@interface RCTConvert (RCanvas)

+ (RCanvas*)inflatePath:(id)json;
+ (UIColor *)parseColor:(id)json;
+ (CGPoint)parsePoint:(id)json;
+ (NSMutableArray*)parsePointArray:(id)json;

@end
