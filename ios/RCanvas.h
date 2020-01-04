#import <UIKit/UIKit.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTBridge.h>
#import "RPath.h"

@class RCTEventDispatcher;

@interface RCanvas : UIView

//@property (nonatomic, copy) RCTBubblingEventBlock onChange;
@property (nonatomic) NSMutableArray<RPath *> *paths;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher;

- (nullable RPath *)getPath:(int)pathId;
- (NSArray<RPath *> *)getPaths:(NSArray<NSNumber *> *)pathIDArray;
- (void)addPaths:(NSArray<RPath *> *)paths;
- (void)deletePaths:(NSArray<RPath *> *)paths;
- (void)allocPath:(int)pathId strokeColor:(UIColor*)strokeColor strokeWidth:(int)strokeWidth;
- (void)drawPoint:(CGPoint)point pathId:(int)pathId;
- (void)endPath:(int)pathId;
- (void)clear;


@end
