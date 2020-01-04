#import <React/RCTConvert.h>
#import "RCTConvert+RCanvas.h"
#import "RCanvas.h"
#import "RPath.h"

@interface RPathData : NSObject <RPathDataP>
@property (nonatomic) int id;
@end

@implementation RCTConvert (RCanvas)

+ (RPath *)inflatePath:(id)json
{
    return [[RPath alloc]
            initWithId: [json[@"id"] intValue]
            strokeColor: [self parseColor:json[@"strokeColor"]]
            strokeWidth: [json[@"strokeWidth"] floatValue]
            points: [self parsePointArray:json[@"points"]]
            ];
}

+ (RPath *)resolvePath:(id)json canvas:(RCanvas *)canvas
{
    int pathID = [json[@"id"] intValue];
    return [canvas getPath:pathID];
}

+ (RPathData *)updatePath:(id)json canvas:(RCanvas *)canvas
{
    RPathData *data = [RPathData new];
    [data setId:[json[@"id"] intValue]];
    NSArray<NSString*> *keys = [json allKeys];
    if ([keys containsObject:@"strokeColor"]) {
        [data setStrokeColor:[self parseColor:json[@"strokeColor"]]];
    }
    /*
    if ([keys containsObject:@"strokeWidth"] && [json[@"strokeWidth"] floatValue] != [NSNumb]) {
         [data setStrokeWidth:[json[@"strokeWidth"] floatValue]];
    }
     */
    if ([keys containsObject:@"points"]) {
        [data setPoints:[self parsePointArray:json[@"points"]]];
    }

    return data;
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
        [cgPoints addObject: [NSValue valueWithCGPoint: [self parsePoint: coor]]];
    }
    return cgPoints;
}


@end
