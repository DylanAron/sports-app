package com.huojian.qlh

import android.Manifest
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.baidu.mobads.action.BaiduAction
import com.baidu.mobads.action.PrivacyStatus
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.github.gzuliyujiang.oaid.DeviceIdentifier
import kotlin.concurrent.thread

class AppTrackModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var sdkInitialized = false
    }

    override fun getName(): String = "AppTrackModule"

    /**
     * 从 JS 层获取 BD_APP_ID 和 APP_SECRET 后初始化 SDK
     * APP_SECRET 从服务端获取，不硬编码在客户端
     */
    @ReactMethod
    fun initSdk(appId: Double, appSecret: String) {
        if (sdkInitialized) {
            Log.d("AppTrack", "SDK already initialized, skip")
            return
        }
        if (BuildConfig.DEBUG) {
            Log.d("AppTrack", "Debug build, skip Baidu oCPX SDK init from JS")
            return
        }
        try {
            BaiduAction.setPrintLog(BuildConfig.DEBUG)
            BaiduAction.init(
                reactApplicationContext,
                appId.toLong(),
                appSecret
            )
            BaiduAction.setActivateInterval(reactApplicationContext, 30)

            // 回传运行时权限状态
            BaiduAction.onRequestPermissionsResult(
                1024,
                arrayOf(Manifest.permission.READ_PHONE_STATE),
                if (ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED)
                    intArrayOf(0) else intArrayOf(-1)
            )
            sdkInitialized = true
            Log.d("AppTrack", "SDK initialized from JS, appId=$appId")
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to init SDK", e)
        }
    }

    /**
     * 上报激活转化事件
     */
    @ReactMethod
    fun reportActivation() {
        if (!sdkInitialized) {
            Log.w("AppTrack", "SDK not initialized, activation skipped")
            return
        }
        try {
            BaiduAction.logAction("ACTIVATE")
            Log.d("AppTrack", "Activation event reported")
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to report activation", e)
        }
    }

    /**
     * 上报自定义转化事件
     */
    @ReactMethod
    fun logAction(actionType: String, actionParam: String = "") {
        if (!sdkInitialized) {
            Log.w("AppTrack", "SDK not initialized, action $actionType skipped")
            return
        }
        try {
            if (actionParam.isNotBlank()) {
                val json = org.json.JSONObject(actionParam)
                BaiduAction.logAction(actionType, json)
            } else {
                BaiduAction.logAction(actionType)
            }
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to log action", e)
        }
    }

    /**
     * 设置用户隐私授权状态
     */
    @ReactMethod
    fun setPrivacyAgreed(agreed: Boolean) {
        try {
            BaiduAction.setPrivacyStatus(
                if (agreed) PrivacyStatus.AGREE
                else PrivacyStatus.DISAGREE
            )
            Log.d("AppTrack", "Privacy status set: ${if (agreed) "AGREE" else "DISAGREE"}")

            if (agreed) {
                DeviceIdentifier.register(reactApplicationContext.getApplicationContext() as android.app.Application)
            }
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to set privacy status", e)
        }
    }

    private fun fetchOaid(context: android.content.Context): String {
        var oaid = DeviceIdentifier.getOAID(context)
        if (oaid != null && oaid.isNotBlank()) return oaid
        for (i in 1..15) {
            try { Thread.sleep(200) } catch (e: InterruptedException) { break }
            oaid = DeviceIdentifier.getOAID(context)
            if (oaid != null && oaid.isNotBlank()) {
                Log.d("AppTrack", "OAID fetched after ${i * 200}ms")
                return oaid
            }
        }
        return ""
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        val ctx = reactApplicationContext
        val androidId = android.provider.Settings.Secure.getString(
            ctx.contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        ) ?: ""

        Log.d("AppTrack", "========== ANDROID_ID: $androidId ==========")

        thread {
            try {
                DeviceIdentifier.register(ctx.applicationContext as android.app.Application)
                val oaid = fetchOaid(ctx)
                val guid = DeviceIdentifier.getGUID(ctx)
                Log.d("AppTrack", "========== OAID: '$oaid' ==========")
                Log.d("AppTrack", "========== GUID: '$guid' ==========")
                Handler(Looper.getMainLooper()).post {
                    val map = com.facebook.react.bridge.Arguments.createMap()
                    map.putString("androidId", androidId)
                    map.putString("oaid", oaid)
                    map.putString("guid", guid)
                    promise.resolve(map)
                }
            } catch (e: Exception) {
                Log.e("AppTrack", "getDeviceInfo failed", e)
                Handler(Looper.getMainLooper()).post {
                    val map = com.facebook.react.bridge.Arguments.createMap()
                    map.putString("androidId", androidId)
                    map.putString("oaid", "")
                    map.putString("guid", "")
                    promise.resolve(map)
                }
            }
        }
    }
}
