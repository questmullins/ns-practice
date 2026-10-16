package com.questmullins.nspractice

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.questmullins.nspractice.ui.App

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val content = Content.load(applicationContext)
        val progress = ProgressStore(applicationContext)
        setContent { App(content, progress) }
    }
}
