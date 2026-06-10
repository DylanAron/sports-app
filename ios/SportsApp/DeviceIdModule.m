#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DeviceIdModule, NSObject)

RCT_EXTERN_REMAP_MODULE(DeviceIdModule, DeviceIdModule)

RCT_EXTERN_METHOD(getDeviceId:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
