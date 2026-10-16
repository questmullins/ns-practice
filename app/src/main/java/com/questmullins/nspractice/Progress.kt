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
    private val prefs = context.getSharedPreferences("progress", Context.MODE_PRIVATE)
    private var revision by mutableIntStateOf(0)

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
}
