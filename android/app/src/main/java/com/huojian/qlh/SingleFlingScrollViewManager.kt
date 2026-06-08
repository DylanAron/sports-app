package com.huojian.qlh

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class SingleFlingScrollViewManager : ViewGroupManager<SingleFlingScrollView>() {

    override fun getName(): String = "SingleFlingScrollView"

    override fun createViewInstance(context: ThemedReactContext): SingleFlingScrollView {
        return SingleFlingScrollView(context)
    }

    @ReactProp(name = "cardWidth", defaultFloat = 0f)
    fun setCardWidth(view: SingleFlingScrollView, width: Float) {
        view.cardWidth = width.toInt()
    }

    @ReactProp(name = "cardPaddingStart", defaultFloat = 0f)
    fun setCardPaddingStart(view: SingleFlingScrollView, padding: Float) {
        view.cardPaddingStart = padding.toInt()
    }
}
