#import "RCanvasManager.h"
#import "RCanvas.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTView.h>
#import <React/UIView+React.h>
#import <React/RCTUIManager.h>

@implementation RCanvasManager

RCT_EXPORT_MODULE(ReanimatedCanvasManager)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

-(NSDictionary *)constantsToExport {
    return @{};
}

#pragma mark - Events

RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock);

#pragma mark - Props
/*
RCT_CUSTOM_VIEW_PROPERTY(localSourceImage, NSDictionary, RCanvas)
{
    RCanvas *currentView = !view ? defaultView : view;
    NSDictionary *dict = [RCTConvert NSDictionary:json];
    dispatch_async(dispatch_get_main_queue(), ^{
        [currentView openSketchFile:dict[@"filename"]
                          directory:[dict[@"directory"] isEqual: [NSNull null]] ? @"" : dict[@"directory"]
                        contentMode:[dict[@"mode"] isEqual: [NSNull null]] ? @"" : dict[@"mode"]];
    });
}

RCT_CUSTOM_VIEW_PROPERTY(text, NSArray, RCanvas)
{
    RCanvas *currentView = !view ? defaultView : view;
    NSArray *arr = [RCTConvert NSArray:json];
    dispatch_async(dispatch_get_main_queue(), ^{
        [currentView setCanvasText:arr];
    });
}
 */

#pragma mark - Lifecycle

- (UIView *)view
{
    return [[RCanvas alloc] initWithEventDispatcher: self.bridge.eventDispatcher];
}

#pragma mark - Exported methods


RCT_EXPORT_METHOD(addPoint:(nonnull NSNumber *)reactTag x: (float)x y: (float)y)
{
    [self runCanvas:reactTag block:^(RCanvas *canvas) {
        [canvas addPointX:x Y:y];
    }];
}

RCT_EXPORT_METHOD(addPath:(nonnull NSNumber *)reactTag pathId: (int) pathId strokeColor: (UIColor*) strokeColor strokeWidth: (int) strokeWidth points: (NSArray*) points)
{
    NSMutableArray *cgPoints = [[NSMutableArray alloc] initWithCapacity: points.count];
    for (NSString *coor in points) {
        NSArray *coorInNumber = [coor componentsSeparatedByString: @","];
        [cgPoints addObject: [NSValue valueWithCGPoint: CGPointMake([coorInNumber[0] floatValue], [coorInNumber[1] floatValue])]];
    }

    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas
                   addPath: pathId
                   strokeColor: strokeColor
                   strokeWidth: strokeWidth
                   points: cgPoints
                   ];
              }
     ];
}

RCT_EXPORT_METHOD(startPath:(nonnull NSNumber *)reactTag pathId: (int) pathId strokeColor: (UIColor*) strokeColor strokeWidth: (int) strokeWidth)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas startPath: pathId strokeColor: strokeColor strokeWidth: strokeWidth];
              }
     ];
}

RCT_EXPORT_METHOD(deletePath:(nonnull NSNumber *)reactTag pathId: (int) pathId)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas deletePath: pathId];
              }
     ];
}

RCT_EXPORT_METHOD(endPath:(nonnull NSNumber *)reactTag)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas endPath];
              }
     ];
}

RCT_EXPORT_METHOD(clear:(nonnull NSNumber *)reactTag)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas clear];
              }
     ];
}

RCT_EXPORT_METHOD(isPointOnPath:(nonnull NSNumber *)reactTag x:(nonnull NSNumber *)x y:(nonnull NSNumber* )y pathId:(nonnull NSNumber *)pathId callback:(RCTResponseSenderBlock)callback)
{
    NSNumber *_pathId = [pathId intValue] == -1 ? nil: pathId;
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  callback(@[[NSNull null], [canvas isPointOnPath: [x floatValue] y:[y floatValue] pathId:_pathId]]);
              }
     ];
}

#pragma mark - Utils

- (void)runCanvas:(nonnull NSNumber *)reactTag block:(void (^)(RCanvas *canvas))block {
    [self.bridge.uiManager addUIBlock:
     ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCanvas *> *viewRegistry){

         RCanvas *view = viewRegistry[reactTag];
         if (!view || ![view isKindOfClass:[RCanvas class]]) {
             RCTLogError(@"Cannot find RCanvas with tag #%@", reactTag);
             return;
         }

         block(view);
     }];
}

@end
