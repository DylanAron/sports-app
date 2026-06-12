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

    // 百度 oCPX SDK 在 Application.onCreate 中完成初始化
    // 与官方 BaiduMobadsActionDemo 一致，密钥写死在客户端
    // debug/release 均初始化，测试环境自行判断
    try {
      BaiduAction.setPrintLog(false)
      BaiduAction.enableClip(false)
      BaiduAction.enableMarketReferrer(false)
      BaiduAction.enableNetworkType(false)
      BaiduAction.init(this, 22870L, "0ce63b2c2dee0b50c6664c6d7b7e166c")
      BaiduAction.setActivateInterval(this, 30)
      BaiduAction.disenableMiit(true)
      BaiduAction.setOaid("")
      Log.d("MainApplication", "Baidu oCPX SDK initialized")
    } catch (e: Exception) {
      Log.e("MainApplication", "Failed to init Baidu oCPX SDK", e)
    }
  }
}
