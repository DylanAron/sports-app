package com.huojian.qlh

import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise

class DeviceIdModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DeviceIdModule"

    @com.facebook.react.bridge.ReactMethod
    fun getDeviceId(promise: Promise) {
        try {
            val context = reactApplicationContext
            val androidId = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            )
            if (androidId.isNullOrBlank()) {
                promise.reject("DEVICE_ID_ERROR", "Unable to get ANDROID_ID")
            } else {
                promise.resolve(androidId)
            }
        } catch (e: Exception) {
            promise.reject("DEVICE_ID_ERROR", e.message ?: "Unknown error")
        }
    }
}
