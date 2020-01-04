
#import "RPath.h"

@interface PathIntersectionHelper : NSObject

+ (NSArray<NSNumber *> *)isPointOnPath:(CGPoint)point paths:(NSArray<RPath *> *)paths;

@end
