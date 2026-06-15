package com.huojian.qlh

import android.content.Context
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
import com.facebook.react.bridge.WritableMap
import com.github.gzuliyujiang.oaid.DeviceIdentifier
import kotlin.concurrent.thread

class AppTrackModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppTrackModule"

    companion object {
        private const val DEVICE_INFO_PREFS = "privacy_device_info"
        private const val KEY_DEVICE_INFO_FETCHED = "device_info_fetched"
        private const val KEY_ANDROID_ID = "android_id"
        private const val KEY_OAID = "oaid"
        private const val KEY_GUID = "guid"
        private var sdkInitialized = false
        private var deviceInfoFetched = false
        private var cachedAndroidId = ""
        private var cachedOaid = ""
        private var cachedGuid = ""
        private val deviceInfoLock = Any()
    }

    private fun hasPrivacyAgreed(): Boolean =
        SplashActivity.hasUserAgreed(reactApplicationContext)

    private fun buildDeviceInfoMap(
        androidId: String = cachedAndroidId,
        oaid: String = cachedOaid,
        guid: String = cachedGuid
    ): WritableMap {
        val map = com.facebook.react.bridge.Arguments.createMap()
        map.putString("androidId", androidId)
        map.putString("oaid", oaid)
        map.putString("guid", guid)
        map.putString("imei", "")
        map.putString("sdkInt", Build.VERSION.SDK_INT.toString())
        map.putString("brand", Build.BRAND)
        map.putString("model", Build.MODEL)
        return map
    }

    /**
     * 初始化百度 oCPX SDK（用户同意隐私协议后由 JS 调用）
     * 测试包（BuildConfig.DEBUG）跳过不上报
     */
    @ReactMethod
    fun initSdk(appId: Double, appSecret: String, promise: Promise) {
        if (!hasPrivacyAgreed()) {
            Log.w("AppTrack", "Privacy not agreed, block SDK init")
            promise.reject("PRIVACY_NOT_AGREED", "Privacy agreement has not been accepted")
            return
        }
        if (sdkInitialized) {
            Log.d("AppTrack", "SDK already initialized, skip")
            promise.resolve(true)
            return
        }
        if (BuildConfig.DEBUG) {
            Log.d("AppTrack", "Debug build, skip SDK init")
            promise.resolve(true)
            return
        }
        try {
            BaiduAction.setPrintLog(false)
            BaiduAction.enableClip(false)
            BaiduAction.enableMarketReferrer(false)
            BaiduAction.enableNetworkType(false)
            BaiduAction.init(reactApplicationContext, appId.toLong(), appSecret)
            BaiduAction.setActivateInterval(reactApplicationContext, 30)
            BaiduAction.disenableMiit(true)
            BaiduAction.setOaid("")
            sdkInitialized = true
            Log.d("AppTrack", "SDK initialized successfully")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to init SDK", e)
            promise.reject("INIT_FAILED", e.message)
        }
    }

    /**
     * 上报激活事件到百度移动统计（AppTrack 归因）
     */
    @ReactMethod
    fun reportActivation(promise: Promise) {
        if (!hasPrivacyAgreed()) {
            promise.reject("PRIVACY_NOT_AGREED", "Privacy agreement has not been accepted")
            return
        }
        if (!sdkInitialized) {
            promise.reject("NOT_INITIALIZED", "SDK not initialized")
            return
        }
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
     * 上报自定义转化事件（注册、付费等）
     */
    @ReactMethod
    fun logAction(actionType: String, actionParam: String = "", promise: Promise) {
        if (!hasPrivacyAgreed()) {
            promise.reject("PRIVACY_NOT_AGREED", "Privacy agreement has not been accepted")
            return
        }
        if (!sdkInitialized) {
            promise.reject("NOT_INITIALIZED", "SDK not initialized")
            return
        }
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
     * 设置用户隐私授权状态（用户同意后同时设置 OAID）
     */
    @ReactMethod
    fun setPrivacyAgreed(agreed: Boolean) {
        if (agreed && !hasPrivacyAgreed()) {
            Log.w("AppTrack", "Privacy not agreed, block setPrivacyAgreed")
            return
        }
        if (!sdkInitialized) {
            Log.w("AppTrack", "SDK not initialized, skip setPrivacyAgreed")
            return
        }
        try {
            BaiduAction.setPrivacyStatus(
                if (agreed) PrivacyStatus.AGREE
                else PrivacyStatus.DISAGREE
            )
            Log.d("AppTrack", "Privacy status set: ${if (agreed) "AGREE" else "DISAGREE"}")

            if (agreed) {
                thread {
                    val oaid = getDeviceInfoOnce(reactApplicationContext).second
                    if (oaid.isNotBlank()) {
                        BaiduAction.setOaid(oaid)
                        Log.d("AppTrack", "OAID set: $oaid")
                    } else {
                        Log.w("AppTrack", "OAID empty, skip")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("AppTrack", "Failed to set privacy status", e)
        }
    }

    private fun getDeviceInfoOnce(context: android.content.Context): Triple<String, String, String> {
        synchronized(deviceInfoLock) {
            if (deviceInfoFetched) {
                return Triple(cachedAndroidId, cachedOaid, cachedGuid)
            }

            val prefs = context.getSharedPreferences(DEVICE_INFO_PREFS, Context.MODE_PRIVATE)
            if (prefs.getBoolean(KEY_DEVICE_INFO_FETCHED, false)) {
                cachedAndroidId = prefs.getString(KEY_ANDROID_ID, "") ?: ""
                cachedOaid = prefs.getString(KEY_OAID, "") ?: ""
                cachedGuid = prefs.getString(KEY_GUID, "") ?: ""
                deviceInfoFetched = true
                return Triple(cachedAndroidId, cachedOaid, cachedGuid)
            }

            val storedAndroidId = prefs.getString(KEY_ANDROID_ID, "") ?: ""
            val androidId = storedAndroidId.ifBlank {
                android.provider.Settings.Secure.getString(
                    context.contentResolver,
                    android.provider.Settings.Secure.ANDROID_ID
                ) ?: ""
            }

            DeviceIdentifier.register(context.applicationContext as android.app.Application)
            val oaid = fetchOaid(context)
            val guid = DeviceIdentifier.getGUID(context) ?: ""

            cachedAndroidId = androidId
            cachedOaid = oaid
            cachedGuid = guid
            deviceInfoFetched = true
            prefs.edit()
                .putBoolean(KEY_DEVICE_INFO_FETCHED, true)
                .putString(KEY_ANDROID_ID, cachedAndroidId)
                .putString(KEY_OAID, cachedOaid)
                .putString(KEY_GUID, cachedGuid)
                .apply()
            return Triple(cachedAndroidId, cachedOaid, cachedGuid)
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
        if (!hasPrivacyAgreed()) {
            Log.w("AppTrack", "Privacy not agreed, block getDeviceInfo")
            promise.resolve(buildDeviceInfoMap("", "", ""))
            return
        }
        val ctx = reactApplicationContext

        thread {
            try {
                val (androidId, oaid, guid) = getDeviceInfoOnce(ctx)
                Log.d("AppTrack", "========== ANDROID_ID: $androidId ==========")
                Log.d("AppTrack", "========== SDK_INT: ${Build.VERSION.SDK_INT} ==========")
                Log.d("AppTrack", "========== BRAND: ${Build.BRAND} ==========")
                Log.d("AppTrack", "========== MODEL: ${Build.MODEL} ==========")
                Log.d("AppTrack", "========== OAID: '$oaid' ==========")
                Log.d("AppTrack", "========== GUID: '$guid' ==========")
                if (sdkInitialized && oaid.isNotBlank()) {
                    BaiduAction.setOaid(oaid)
                }
                Handler(Looper.getMainLooper()).post {
                    promise.resolve(buildDeviceInfoMap(androidId, oaid, guid))
                }
            } catch (e: Exception) {
                Log.e("AppTrack", "getDeviceInfo failed", e)
                Handler(Looper.getMainLooper()).post {
                    promise.resolve(buildDeviceInfoMap())
                }
            }
        }
    }
}
