package com.huojian.qlh

import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.text.SpannableString
import android.text.Spanned
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    companion object {
        private const val PREFS_NAME = "privacy_prefs"
        private const val KEY_AGREED = "privacy_agreed"

        fun hasUserAgreed(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getBoolean(KEY_AGREED, false)
        }

        fun setUserAgreed(context: Context) {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_AGREED, true)
                .apply()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (hasUserAgreed(this)) {
            startMainActivity()
            return
        }
        showPrivacyDialog()
    }

    // ─── 隐私弹窗 ───

    private fun showPrivacyDialog() {
        val prefix = "为保障您的合法权益，给您提供更优质的服务体验，我们诚挚地告知：在您使用本APP各项功能服务前，请认真阅读"
        val agreementName = "《用户服务协议》"
        val conjunction = "及"
        val privacyName = "《隐私政策》"
        val suffix = "。"
        val middle = "我们将严格遵循合法、正当、必要的原则，仅收集、使用为保障APP正常运行、实现核心服务所需的必要个人信息，全力保护您的个人信息安全与隐私权益，绝不会非法收集、滥用、泄露您的个人数据。"
        val ending = "您的确认即代表您已充分阅读、理解并同意上述协议与政策内容。我们将持续保障您的隐私安全，为您提供安全、可靠的使用服务。"

        val body = prefix + agreementName + conjunction + privacyName + suffix + "\n\n" + middle + "\n\n" + ending

        val spannable = SpannableString(body)

        val agreementStart = prefix.length
        val agreementEnd = agreementStart + agreementName.length
        spannable.setSpan(object : ClickableSpan() {
            override fun onClick(widget: View) {
                showFullContent("用户服务协议", rawId = R.raw.user_agreement)
            }
        }, agreementStart, agreementEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        val privacyStart = agreementEnd + conjunction.length
        val privacyEnd = privacyStart + privacyName.length
        spannable.setSpan(object : ClickableSpan() {
            override fun onClick(widget: View) {
                showWebUrl("隐私政策", "https://6hlot.com/privacy")
            }
        }, privacyStart, privacyEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        val bodyText = TextView(this).apply {
            text = spannable
            textSize = 14f
            setLineSpacing(0f, 1.5f)
            setTextColor(0xFF555555.toInt())
            movementMethod = LinkMovementMethod.getInstance()
        }

        val scrollView = ScrollView(this).apply {
            val p = dpToPx(16)
            setPadding(p, p, p, p)
            addView(bodyText, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ))
        }

        // 底部两个按钮（先创建，后面绑定点击事件）
        val agreeBtn = createBtn("同意并继续", primary = true)
        val disagreeBtn = createBtn("不同意", primary = false)

        val buttonRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            val m = dpToPx(16)
            setPadding(m, 0, m, 0)
            gravity = Gravity.CENTER
            addView(disagreeBtn, LinearLayout.LayoutParams(0, dpToPx(48), 1f).apply {
                rightMargin = dpToPx(6)
            })
            addView(agreeBtn, LinearLayout.LayoutParams(0, dpToPx(48), 1f).apply {
                leftMargin = dpToPx(6)
            })
        }

        val bottomSpace = View(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(20)
            )
        }

        val contentWrapper = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(scrollView, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
            ))
            addView(buttonRow, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ))
            addView(bottomSpace)
        }

        val dialog = buildDialog("同意隐私协议", contentWrapper, maxHeightPercent = 0.80f, cancelable = false)

        agreeBtn.setOnClickListener {
            setUserAgreed(this@SplashActivity)
            dialog.dismiss()
            (application as MainApplication).startReactNative()
            startMainActivity()
        }
        disagreeBtn.setOnClickListener {
            finishAffinity()
        }

        dialog.show()
    }

    // ─── WebView 加载 URL 弹窗 ───

    private fun showWebUrl(title: String, url: String) {
        val webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    view.loadUrl(request.url.toString())
                    return true
                }
            }
            settings.apply {
                javaScriptEnabled = true
                builtInZoomControls = false
                displayZoomControls = false
            }
            loadUrl(url)
        }

        val closeBtn = createBtn("关闭", primary = true)

        val buttonRow = FrameLayout(this).apply {
            val m = dpToPx(16)
            setPadding(m, 0, m, dpToPx(20))
            addView(closeBtn, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(48)
            ))
        }

        val contentWrapper = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(webView, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
            ))
            addView(buttonRow, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ))
        }

        val dialog = buildDialog(title, contentWrapper, maxHeightPercent = 0.80f, cancelable = true, bottomGap = true)
        closeBtn.setOnClickListener { dialog.dismiss() }
        dialog.show()
    }

    // ─── 协议全文弹窗（WebView 加载 HTML）───

    private fun showFullContent(title: String, rawId: Int) {
        val rawHtml = readRawText(rawId)
        val html = """
            <!DOCTYPE html>
            <html><head>
            <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, sans-serif;
                padding: 16px; color: #333; background: #fff;
                font-size: 15px; line-height: 1.8; margin: 0;
              }
              h3 { color: #1e293b; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
              p { color: #475569; margin-bottom: 12px; }
            </style>
            </head><body>$rawHtml</body></html>
        """.trimIndent()

        val webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            webViewClient = WebViewClient()
            settings.apply {
                javaScriptEnabled = false
                builtInZoomControls = false
                displayZoomControls = false
            }
            loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
        }

        val closeBtn = createBtn("关闭", primary = true)

        val buttonRow = FrameLayout(this).apply {
            val m = dpToPx(16)
            setPadding(m, 0, m, dpToPx(20))
            addView(closeBtn, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(48)
            ))
        }

        val contentWrapper = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(webView, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
            ))
            addView(buttonRow, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ))
        }

        val dialog = buildDialog(title, contentWrapper, maxHeightPercent = 0.80f, cancelable = true, bottomGap = true)
        closeBtn.setOnClickListener { dialog.dismiss() }
        dialog.show()
    }

    // ─── Dialog 构建 ───

    private fun buildDialog(
        title: String,
        contentView: View,
        maxHeightPercent: Float,
        cancelable: Boolean,
        bottomGap: Boolean = false
    ): Dialog {
        val titleText = TextView(this).apply {
            text = title
            textSize = 18f
            setTextColor(0xFF222222.toInt())
            gravity = Gravity.CENTER
            setPadding(dpToPx(20), dpToPx(24), dpToPx(20), 0)
        }

        val divider = View(this).apply {
            setBackgroundColor(0xFFEEEEEE.toInt())
            val m = dpToPx(20)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 1
            ).apply { setMargins(m, dpToPx(16), m, 0) }
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(titleText, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ))
            addView(divider)
            addView(contentView, LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
            ))
        }

        val dialog = Dialog(this)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(cancelable)
        dialog.setContentView(root)

        val window = dialog.window
        if (window != null) {
            val bg = GradientDrawable().apply {
                cornerRadius = dpToPx(16).toFloat()
                setColor(0xFFFFFFFF.toInt())
            }
            window.setBackgroundDrawable(bg)
            window.setGravity(Gravity.CENTER)

            val metrics = resources.displayMetrics
            val maxHeight = (metrics.heightPixels * maxHeightPercent).toInt()
            val width = (metrics.widthPixels * 0.90).toInt()

            if (bottomGap) {
                // 阅读弹窗（用户协议/隐私政策）：85% 屏幕高度，居中显示
                val dialogHeight = (metrics.heightPixels * 0.85).toInt().coerceAtMost(maxHeight)
                window.setLayout(width, dialogHeight)
            } else {
                // 主隐私弹窗：WRAP_CONTENT 自适应，不超过 80%
                window.setLayout(width, ViewGroup.LayoutParams.WRAP_CONTENT)
                root.post {
                    if (root.measuredHeight > maxHeight) {
                        window.setLayout(width, maxHeight)
                    }
                }
            }
        }

        return dialog
    }

    // ─── 通用按钮 ───

    private fun createBtn(text: String, primary: Boolean): TextView {
        return TextView(this).apply {
            this.text = text
            gravity = Gravity.CENTER
            textSize = 15f
            if (primary) {
                setTextColor(0xFFFFFFFF.toInt())
                val bg = GradientDrawable().apply {
                    cornerRadius = dpToPx(10).toFloat()
                    setColor(0xFF2563EB.toInt())
                }
                setBackground(bg)
            } else {
                setTextColor(0xFF666666.toInt())
                val bg = GradientDrawable().apply {
                    cornerRadius = dpToPx(10).toFloat()
                    setColor(0xFFF5F5F5.toInt())
                    setStroke(dpToPx(1), 0xFFD0D0D0.toInt())
                }
                setBackground(bg)
            }
        }
    }

    // ─── 工具 ───

    private fun readRawText(rawId: Int): String {
        return try {
            val inputStream = resources.openRawResource(rawId)
            val bytes = inputStream.readBytes()
            inputStream.close()
            String(bytes, Charsets.UTF_8)
        } catch (e: Exception) {
            "内容加载失败"
        }
    }

    private fun startMainActivity() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish()
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
