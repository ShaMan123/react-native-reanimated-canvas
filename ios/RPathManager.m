#import "RPathManager.h"
#import "RPath.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTView.h>
#import <React/UIView+React.h>
#import <React/RCTUIManager.h>

@implementation RPathManager

RCT_EXPORT_MODULE(RNRPath)

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
    return [[RPath alloc] init];
}

#pragma mark - Exported methods



#pragma mark - Utils

- (void)runBlock:(nonnull NSNumber *)reactTag block:(void (^)(RPath *path))block {
    [self.bridge.uiManager addUIBlock:
     ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RPath *> *viewRegistry){
         
         RPath *view = viewRegistry[reactTag];
         if (!view || ![view isKindOfClass:[RPath class]]) {
             RCTLogError(@"Cannot find RPath with tag #%@", reactTag);
             return;
         }
         
         block(view);
     }];
}

@end
