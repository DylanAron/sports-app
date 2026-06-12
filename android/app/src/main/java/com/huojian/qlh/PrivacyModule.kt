package com.huojian.qlh

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * 原生隐私状态模块 — 让 JS 层可以读取 SplashActivity 写入的隐私协议同意状态。
 *
 * 防止 JS 层 PrivacyAgreementModal 重复显示。
 */
class PrivacyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PrivacyModule"

    @ReactMethod
    fun hasUserAgreed(promise: Promise) {
        try {
            val agreed = SplashActivity.hasUserAgreed(reactApplicationContext)
            promise.resolve(agreed)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
