#import <React/RCTConvert.h>
#import "RCTConvert+RCanvas.h"
#import "RCanvas.h"
#import "RPath.h"

@implementation RCTConvert (RCanvas)

+ (RCanvasPath *)inflatePath:(id)json
{
    return [[RCanvasPath alloc]
            initWithId: [json[@"id"] intValue]
            strokeColor: [RCTConvert parseColor:json[@"strokeColor"]]
            strokeWidth: [json[@"strokeWidth"]]
            points: [RCTConvert parsePointArray:config[@"points"]]
            ];
}

+ (UIColor *)parseColor:(id)json
{
    long color = [json longValue];
    return [UIColor colorWithRed:(CGFloat)((color & 0x00FF0000) >> 16) / 0xFF
                           green:(CGFloat)((color & 0x0000FF00) >> 8) / 0xFF
                            blue:(CGFloat)((color & 0x000000FF)) / 0xFF
                           alpha:(CGFloat)((color & 0xFF000000) >> 24) / 0xFF];
}

+ (CGPoint)parsePoint:(id)json
{
    return CGPointMake([json[@"x"] floatValue], [json[@"y"] floatValue]);
}

+ (NSMutableArray*)parsePointArray:(id)json
{
    NSArray* points = [json array];
    NSMutableArray *cgPoints = [[NSMutableArray alloc] initWithCapacity: [points count]];
    for (NSObject *coor in json) {
        [cgPoints addObject: [NSValue valueWithCGPoint: [RCTConvert parsePoint: coor]]];
    }
    return cgPoints;
}


@end
