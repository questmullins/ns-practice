package com.questmullins.nspractice

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class Block(
    val type: String,
    val text: String,
    val items: List<String>,
    val rows: List<List<String>>,
)

data class Section(val title: String, val blocks: List<Block>)

data class Lab(val title: String, val goal: String, val steps: List<String>)

data class Flashcard(val front: String, val back: String)

data class Question(
    val id: String,
    val chapterId: Int,
    val prompt: String,
    val code: String?,
    val options: List<String>,
    val answer: Int,
    val explain: String,
)

data class Chapter(
    val id: Int,
    val title: String,
    val subtitle: String,
    val week: String,
    val sections: List<Section>,
    val takeaways: List<String>,
    val lab: Lab,
    val flashcards: List<Flashcard>,
    val questions: List<Question>,
)

data class GlossaryEntry(val term: String, val definition: String)

/** A Code Lab challenge as the study app lists it. Code Lab itself holds the brief and grader. */
data class Challenge(val id: String, val chapterId: Int, val title: String, val summary: String)

class Content(val chapters: List<Chapter>, val glossary: List<GlossaryEntry>, val challenges: List<Challenge>) {
    val allQuestions: List<Question> = chapters.flatMap { it.questions }
    private val questionsById = allQuestions.associateBy { it.id }

    fun challengesFor(chapterId: Int): List<Challenge> = challenges.filter { it.chapterId == chapterId }

    fun chapter(id: Int): Chapter = chapters.first { it.id == id }
    fun question(id: String): Question? = questionsById[id]

    companion object {
        fun load(context: Context): Content {
            val json = context.assets.open("content.json").bufferedReader().use { it.readText() }
            val challenges = context.assets.open("challenges.json").bufferedReader().use { it.readText() }
            return parse(JSONObject(json), JSONArray(challenges))
        }

        private fun parse(root: JSONObject, challengeArray: JSONArray): Content {
            val chapters = root.getJSONArray("chapters").objects().map { ch ->
                val id = ch.getInt("id")
                Chapter(
                    id = id,
                    title = ch.getString("title"),
                    subtitle = ch.getString("subtitle"),
                    week = ch.getString("week"),
                    sections = ch.getJSONArray("sections").objects().map { s ->
                        Section(s.getString("title"), s.getJSONArray("blocks").objects().map(::parseBlock))
                    },
                    takeaways = ch.getJSONArray("takeaways").strings(),
                    lab = ch.getJSONObject("lab").let {
                        Lab(it.getString("title"), it.getString("goal"), it.getJSONArray("steps").strings())
                    },
                    flashcards = ch.getJSONArray("flashcards").objects().map {
                        Flashcard(it.getString("front"), it.getString("back"))
                    },
                    questions = ch.getJSONArray("questions").objects().mapIndexed { i, q ->
                        Question(
                            id = "$id-$i",
                            chapterId = id,
                            prompt = q.getString("q"),
                            code = q.optString("code").ifEmpty { null },
                            options = q.getJSONArray("options").strings(),
                            answer = q.getInt("answer"),
                            explain = q.getString("explain"),
                        )
                    },
                )
            }
            val glossary = root.getJSONArray("glossary").objects().map {
                GlossaryEntry(it.getString("term"), it.getString("def"))
            }
            val challenges = challengeArray.objects().map {
                Challenge(it.getString("id"), it.getInt("chapter"), it.getString("title"), it.getString("summary"))
            }
            return Content(chapters, glossary, challenges)
        }

        private fun parseBlock(b: JSONObject) = Block(
            type = b.getString("t"),
            text = b.optString("text"),
            items = b.optJSONArray("items")?.strings() ?: emptyList(),
            rows = b.optJSONArray("rows")?.let { rows ->
                (0 until rows.length()).map { rows.getJSONArray(it).strings() }
            } ?: emptyList(),
        )

        private fun JSONArray.objects(): List<JSONObject> = (0 until length()).map { getJSONObject(it) }
        private fun JSONArray.strings(): List<String> = (0 until length()).map { getString(it) }
    }
}
