package com.huojian.qlh

import android.app.Application
import android.util.Log
import com.baidu.mobads.action.BaiduAction
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
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)

    // debug 构建不初始化百度 oCPX SDK，避免测试数据上报
    if (BuildConfig.DEBUG) {
      Log.d("MainApplication", "Debug build, skip Baidu oCPX SDK initialization")
      return
    }
  }
}
