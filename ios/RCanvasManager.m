#import "RCanvasManager.h"
#import "RCanvas.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTView.h>
#import <React/UIView+React.h>
#import <React/RCTUIManager.h>
#import "PathIntersectionHelper.h"
#import "RCTConvert+RCanvas.h"

@implementation RCanvasManager

RCT_EXPORT_MODULE(RNRCanvas)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

-(NSDictionary *)constantsToExport {
    return @{};
}

#pragma mark - Events

//RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock);

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

RCT_EXPORT_METHOD(alloc:(nonnull NSNumber *)reactTag pathId:(int)pathId strokeColor:(UIColor*) strokeColor strokeWidth:(int)strokeWidth)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas allocPath:pathId strokeColor:strokeColor strokeWidth:strokeWidth];
              }
     ];
}

RCT_EXPORT_METHOD(drawPoint:(nonnull NSNumber *)reactTag x:(float)x y:(float)y pathId:(int)pathId)
{
    [self runCanvas:reactTag block:^(RCanvas *canvas) {
        [canvas drawPoint:CGPointMake(x, y) pathId:pathId];
    }];
}

RCT_EXPORT_METHOD(endPath:(nonnull NSNumber *)reactTag pathId:(int)pathId)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas endPath:pathId];
              }
     ];
}

RCT_EXPORT_METHOD(addPaths:(nonnull NSNumber *)reactTag data:(NSDictionary *)data)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  NSMutableArray *paths = [NSMutableArray new];
                  for (NSDictionary *pathData in data) {
                      [paths addObject:[RCTConvert inflatePath:pathData]];
                  }
                  [canvas addPaths:paths];
              }
     ];
}

RCT_EXPORT_METHOD(deletePaths:(nonnull NSNumber *)reactTag pathIdArray:(NSArray<NSNumber *> *)pathIdArray)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  [canvas deletePaths:[canvas getPaths:pathIdArray]];
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

RCT_EXPORT_METHOD(isPointOnPath:(nonnull NSNumber *)reactTag x:(nonnull NSNumber *)x y:(nonnull NSNumber *)y pathId:(nullable NSNumber *)pathId onSuccess:(RCTResponseSenderBlock)onSuccess onFailure:(RCTResponseSenderBlock)onFailure)
{
    [self runCanvas:reactTag
              block:^(RCanvas *canvas) {
                  NSArray<NSNumber *> *response = [PathIntersectionHelper
                                                   isPointOnPath:CGPointMake([x floatValue], [y floatValue]) paths:[canvas paths]
                                                   ];
                  
                  if (pathId == nil || [pathId intValue] == -1) {
                      onSuccess(response);
                  } else {
                       onSuccess(response);
                      //onSuccess([response containsObject:pathId]);
                  }
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
