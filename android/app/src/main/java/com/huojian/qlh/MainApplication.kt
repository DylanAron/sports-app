package com.huojian.qlh

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(SingleFlingScrollPackage())
          add(DeviceIdPackage())
          add(AppTrackPackage())
          add(PrivacyPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // 仅当用户已同意隐私协议时，才预先加载 React Native。
    // 防止 FaceBookReact 在隐私弹窗前读取 AndroidID。
    if (SplashActivity.hasUserAgreed(this)) {
      loadReactNative(this)
    }
  }

  /**
   * 用户同意隐私协议后由 SplashActivity 调用，显式触发 React Native 加载。
   */
  fun startReactNative() {
    loadReactNative(this)
  }
}
