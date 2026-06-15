package com.huojian.qlh

import android.content.Context
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise

class DeviceIdModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DeviceIdModule"

    companion object {
        private const val DEVICE_INFO_PREFS = "privacy_device_info"
        private const val KEY_ANDROID_ID = "android_id"
        private var cachedDeviceId: String? = null
    }

    @com.facebook.react.bridge.ReactMethod
    fun getDeviceId(promise: Promise) {
        try {
            val context = reactApplicationContext
            if (!SplashActivity.hasUserAgreed(context)) {
                promise.reject("PRIVACY_NOT_AGREED", "Privacy agreement has not been accepted")
                return
            }
            cachedDeviceId?.let {
                promise.resolve(it)
                return
            }
            val prefs = context.getSharedPreferences(DEVICE_INFO_PREFS, Context.MODE_PRIVATE)
            val storedAndroidId = prefs.getString(KEY_ANDROID_ID, "") ?: ""
            if (storedAndroidId.isNotBlank()) {
                cachedDeviceId = storedAndroidId
                promise.resolve(storedAndroidId)
                return
            }
            val androidId = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            )
            if (androidId.isNullOrBlank()) {
                promise.reject("DEVICE_ID_ERROR", "Unable to get ANDROID_ID")
            } else {
                cachedDeviceId = androidId
                prefs.edit().putString(KEY_ANDROID_ID, androidId).apply()
                promise.resolve(androidId)
            }
        } catch (e: Exception) {
            promise.reject("DEVICE_ID_ERROR", e.message ?: "Unknown error")
        }
    }
}
