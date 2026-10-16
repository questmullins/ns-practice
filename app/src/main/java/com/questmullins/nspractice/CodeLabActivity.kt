package com.questmullins.nspractice

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.webkit.WebViewAssetLoader

/**
 * NS Code Lab: a SuiteScript editor that runs code against a mock NetSuite account.
 * It has its own launcher icon and task so it can sit beside the study app in split
 * screen. The page lives in assets/codelab; results flow back through [ProgressStore].
 */
class CodeLabActivity : ComponentActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                // Code Lab is offline; never navigate away from the bundled page.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    request.url.host != HOST
            }
            addJavascriptInterface(Bridge(applicationContext, this@CodeLabActivity), "CodeLabBridge")
        }
        setContentView(webView)
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(startUrl(intent.getStringExtra(EXTRA_CHALLENGE)))
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val id = intent.getStringExtra(EXTRA_CHALLENGE) ?: return
        if (id.matches(SAFE_ID)) webView.evaluateJavascript("window.CodeLab && CodeLab.open('$id')", null)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private fun startUrl(challengeId: String?): String {
        val dark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        val query = buildList {
            if (challengeId != null && challengeId.matches(SAFE_ID)) add("challenge=$challengeId")
            if (dark) add("dark=1")
        }.joinToString("&")
        return "https://$HOST/assets/codelab/index.html" + if (query.isEmpty()) "" else "?$query"
    }

    /** Methods the Code Lab page calls. They run on a WebView background thread. */
    private class Bridge(private val context: Context, private val activity: CodeLabActivity) {
        private val code = context.getSharedPreferences("codelab_code", Context.MODE_PRIVATE)
        private val progress = context.getSharedPreferences(ProgressStore.PREFS, Context.MODE_PRIVATE)

        @JavascriptInterface
        fun loadCode(id: String): String = code.getString(id, "") ?: ""

        @JavascriptInterface
        fun saveCode(id: String, value: String) {
            code.edit().putString(id, value).apply()
        }

        @JavascriptInterface
        fun getStatus(id: String): String = progress.getString("lab_$id", "") ?: ""

        @JavascriptInterface
        fun reportResult(id: String, passed: Boolean, @Suppress("UNUSED_PARAMETER") summary: String) {
            activity.runOnUiThread { ProgressStore.writeLabResult(context, id, passed) }
        }

        @JavascriptInterface
        fun openStudyApp(@Suppress("UNUSED_PARAMETER") chapter: Int) {
            activity.runOnUiThread { Launch.studyApp(activity) }
        }
    }

    companion object {
        const val EXTRA_CHALLENGE = "challenge"
        private const val HOST = "appassets.androidplatform.net"
        private val SAFE_ID = Regex("^[a-z0-9-]{1,40}$")
    }
}

/** Opens the two apps next to each other when the phone is in split-screen mode. */
object Launch {
    private const val ADJACENT = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT

    fun codeLab(context: Context, challengeId: String? = null) {
        val intent = Intent(context, CodeLabActivity::class.java).addFlags(ADJACENT)
        if (challengeId != null) intent.putExtra(CodeLabActivity.EXTRA_CHALLENGE, challengeId)
        context.startActivity(intent)
    }

    fun studyApp(context: Context) {
        context.startActivity(Intent(context, MainActivity::class.java).addFlags(ADJACENT))
    }
}
