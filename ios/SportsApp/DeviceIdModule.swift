import Foundation

@objc(DeviceIdModule)
class DeviceIdModule: NSObject {

  @objc
  func getDeviceId(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let uuid = UIDevice.current.identifierForVendor?.uuidString {
      resolve(uuid)
    } else {
      reject("DEVICE_ID_ERROR", "Unable to get identifierForVendor", nil)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
