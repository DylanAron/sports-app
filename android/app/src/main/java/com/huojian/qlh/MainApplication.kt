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

  companion object {
    // 百度归因 SDK 应用 ID 和密钥（从百度后台获取）
    private const val BD_APP_ID = 22870L
    private const val APP_SECRET = "0ce63b2c2dee0b50c6664c6d7b7e166c"
  }

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

    if (BuildConfig.DEBUG) {
      Log.d("MainApplication", "Debug build, skip Baidu oCPX SDK initialization")
      return
    }

    // 百度 oCPX SDK 必须在 Application.onCreate 中初始化（文档要求）
    // 严格按照官方 demo 的初始化顺序：配置 → init → 激活间隔 → 关闭 OAID 自动采集 → 设置空 OAID
    BaiduAction.setPrintLog(false)
    BaiduAction.enableClip(false)
    BaiduAction.enableMarketReferrer(false)
    BaiduAction.enableNetworkType(false)
    BaiduAction.init(this, BD_APP_ID, APP_SECRET)
    BaiduAction.setActivateInterval(this, 30)

    // 关闭 SDK 内部 OAID 自动采集，由 AppTrackModule 在隐私同意后手动设置
    BaiduAction.disenableMiit(true)
    BaiduAction.setOaid("")
  }
}
