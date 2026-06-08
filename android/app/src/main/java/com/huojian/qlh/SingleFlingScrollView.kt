package com.huojian.qlh

import android.content.Context
import com.facebook.react.views.scroll.ReactHorizontalScrollView

/**
 * 自定义水平滚动视图：完全禁用原生 fling，由 JS 端统一处理卡片切换和居中。
 */
class SingleFlingScrollView(context: Context) : ReactHorizontalScrollView(context) {

    var cardWidth: Int = 0
    var cardPaddingStart: Int = 0

    override fun fling(velocityX: Int) {
        if (cardWidth <= 0) {
            super.fling(velocityX)
            return
        }
        // 不调用 super.fling()，完全禁用原生惯性滚动
        // JS 端通过 onScrollEndDrag 统一处理切换到相邻卡片
    }
}
