package com.questmullins.nspractice

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue

data class TestRecord(val timestamp: Long, val correct: Int, val total: Int) {
    val percent: Int get() = if (total == 0) 0 else correct * 100 / total
}

/**
 * Saves study progress on the device. Every getter reads [revision] so Compose
 * screens recompose after any change.
 */
class ProgressStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private var revision by mutableIntStateOf(0)

    // Code Lab writes results into the same preferences from its own window; this keeps
    // the study screens in sync even when both apps are on screen side by side.
    // SharedPreferences only holds listeners weakly, so keep a reference here.
    private val listener = android.content.SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key == null || key.startsWith("lab_")) changed()
    }

    init {
        prefs.registerOnSharedPreferenceChangeListener(listener)
    }

    /** "passed", "tried" or null for a Code Lab challenge. */
    fun labStatus(challengeId: String): String? {
        revision
        return prefs.getString("lab_$challengeId", null)
    }

    private fun changed() {
        revision++
    }

    fun isRead(chapterId: Int): Boolean {
        revision
        return prefs.getBoolean("read_$chapterId", false)
    }

    fun markRead(chapterId: Int) {
        if (prefs.getBoolean("read_$chapterId", false)) return
        prefs.edit().putBoolean("read_$chapterId", true).apply()
        changed()
    }

    /** Best chapter quiz score as a percentage, or null if never taken. */
    fun bestScore(chapterId: Int): Int? {
        revision
        val v = prefs.getInt("best_$chapterId", -1)
        return if (v < 0) null else v
    }

    fun missedIds(): Set<String> {
        revision
        return prefs.getStringSet("missed", emptySet())!!.toSet()
    }

    fun history(): List<TestRecord> {
        revision
        val raw = prefs.getString("history", "") ?: ""
        return raw.split(";").filter { it.isNotBlank() }.mapNotNull { entry ->
            val p = entry.split("|")
            if (p.size != 3) null else TestRecord(p[0].toLong(), p[1].toInt(), p[2].toInt())
        }
    }

    /**
     * Records a finished quiz. [results] maps question id to whether it was answered
     * correctly. Missed questions join the review pile; correct answers leave it.
     */
    fun recordQuiz(chapterId: Int?, results: Map<String, Boolean>) {
        val correct = results.count { it.value }
        val total = results.size
        val editor = prefs.edit()
        val missed = prefs.getStringSet("missed", emptySet())!!.toMutableSet()
        results.forEach { (id, ok) -> if (ok) missed.remove(id) else missed.add(id) }
        editor.putStringSet("missed", missed)
        if (chapterId != null && total > 0) {
            val pct = correct * 100 / total
            if (pct > prefs.getInt("best_$chapterId", -1)) editor.putInt("best_$chapterId", pct)
        } else if (total > 0) {
            val entries = (history() + TestRecord(System.currentTimeMillis(), correct, total)).takeLast(30)
            editor.putString("history", entries.joinToString(";") { "${it.timestamp}|${it.correct}|${it.total}" })
        }
        editor.apply()
        changed()
    }

    fun reset() {
        prefs.edit().clear().apply()
        changed()
    }

    companion object {
        const val PREFS = "progress"

        /** Saves a Code Lab result. A pass is never downgraded by a later failed attempt. */
        fun writeLabResult(context: Context, challengeId: String, passed: Boolean) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val key = "lab_$challengeId"
            if (!passed && prefs.getString(key, null) == "passed") return
            prefs.edit().putString(key, if (passed) "passed" else "tried").apply()
        }
    }
}
