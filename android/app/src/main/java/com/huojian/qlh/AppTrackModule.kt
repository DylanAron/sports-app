package com.huojian.qlh

import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.baidu.mobads.action.BaiduAction
import com.baidu.mobads.action.PrivacyStatus
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.github.gzuliyujiang.oaid.DeviceIdentifier
import kotlin.concurrent.thread

class AppTrackModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppTrackModule"

    /**
     * SDK 已在 MainApplication.onCreate 中完成初始化，JS 直接调上报接口即可。
     */
    @ReactMethod
    fun reportActivation(promise: Promise) {
        try {
            BaiduAction.logAction("ACTIVATE")
            Log.d("AppTrack", "Activation event reported")
            promise.resolve("已记录激活事件，等待SDK上报")
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to report activation", e)
            promise.reject("LOG_FAILED", "激活上报失败: ${e.message}")
        }
    }

    /**
     * 上报自定义转化事件
     */
    @ReactMethod
    fun logAction(actionType: String, actionParam: String = "", promise: Promise) {
        try {
            if (actionParam.isNotBlank()) {
                val json = org.json.JSONObject(actionParam)
                BaiduAction.logAction(actionType, json)
            } else {
                BaiduAction.logAction(actionType)
            }
            Log.d("AppTrack", "Action logged: $actionType")
            promise.resolve("已记录归因事件，等待SDK上报")
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to log action", e)
            promise.reject("LOG_FAILED", "上报失败: ${e.message}")
        }
    }

    /**
     * 设置用户隐私授权状态，用户同意后同时设置 OAID
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
                // 注册 OAID 监听（Android_CN_OAID 库）
                DeviceIdentifier.register(reactApplicationContext.getApplicationContext() as android.app.Application)

                // 获取 OAID 并传给百度 SDK（SDK 内部已关闭自动采集）
                thread {
                    val oaid = fetchOaid(reactApplicationContext)
                    if (oaid.isNotBlank()) {
                        BaiduAction.setOaid(oaid)
                        Log.d("AppTrack", "OAID set to BaiduAction: $oaid")
                    } else {
                        Log.w("AppTrack", "OAID is empty, not setting to BaiduAction")
                    }
                }
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
        val sdkInt = Build.VERSION.SDK_INT

        Log.d("AppTrack", "========== ANDROID_ID: $androidId ==========")
        Log.d("AppTrack", "========== SDK_INT: $sdkInt ==========")
        Log.d("AppTrack", "========== BRAND: ${Build.BRAND} ==========")
        Log.d("AppTrack", "========== MODEL: ${Build.MODEL} ==========")

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
                    map.putString("imei", "")
                    map.putString("sdkInt", sdkInt.toString())
                    map.putString("brand", Build.BRAND)
                    map.putString("model", Build.MODEL)
                    promise.resolve(map)
                }
            } catch (e: Exception) {
                Log.e("AppTrack", "getDeviceInfo failed", e)
                Handler(Looper.getMainLooper()).post {
                    val map = com.facebook.react.bridge.Arguments.createMap()
                    map.putString("androidId", androidId)
                    map.putString("oaid", "")
                    map.putString("guid", "")
                    map.putString("imei", "")
                    map.putString("sdkInt", sdkInt.toString())
                    map.putString("brand", Build.BRAND)
                    map.putString("model", Build.MODEL)
                    promise.resolve(map)
                }
            }
        }
    }
}
