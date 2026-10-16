package com.questmullins.nspractice.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.questmullins.nspractice.Content
import com.questmullins.nspractice.ProgressStore
import com.questmullins.nspractice.Question

private data class QuizItem(val question: Question, val options: List<String>, val correct: Int)

@Composable
fun QuizScreen(content: Content, progress: ProgressStore, screen: Screen.Quiz, nav: Navigator) {
    val items = remember(screen) {
        screen.questionIds.mapNotNull { content.question(it) }.map { q ->
            val order = q.options.indices.shuffled()
            QuizItem(q, order.map { q.options[it] }, order.indexOf(q.answer))
        }
    }
    var index by remember(screen) { mutableIntStateOf(0) }
    val answers = remember(screen) { mutableStateMapOf<Int, Int>() }
    var finished by remember(screen) { mutableStateOf(false) }
    var confirmExit by remember(screen) { mutableStateOf(false) }

    BackHandler { if (finished || answers.isEmpty()) nav.pop() else confirmExit = true }

    if (items.isEmpty()) {
        Scaffold(topBar = { BackTopBar(screen.title, onBack = { nav.pop() }) }) { p ->
            Text("No questions to show.", modifier = Modifier.padding(p).padding(24.dp))
        }
        return
    }

    fun finish() {
        progress.recordQuiz(
            screen.chapterId,
            items.mapIndexed { i, item -> item.question.id to (answers[i] == item.correct) }.toMap(),
        )
        finished = true
    }

    Scaffold(
        topBar = {
            BackTopBar(screen.title, onBack = { if (finished || answers.isEmpty()) nav.pop() else confirmExit = true })
        },
    ) { padding ->
        if (finished) {
            Results(
                quiz = items,
                answers = answers,
                modifier = Modifier.padding(padding),
                onRetake = { nav.replace(screen.copy(questionIds = screen.questionIds.shuffled(), nonce = System.nanoTime())) },
                onDone = { nav.pop() },
            )
        } else {
            QuestionPage(
                item = items[index],
                number = index + 1,
                total = items.size,
                chapterLabel = if (screen.chapterId == null) {
                    content.chapter(items[index].question.chapterId).let { "Chapter ${it.id} · ${it.title}" }
                } else null,
                chosen = answers[index],
                instantFeedback = screen.instantFeedback,
                modifier = Modifier.padding(padding),
                onChoose = { choice ->
                    if (!screen.instantFeedback || answers[index] == null) answers[index] = choice
                },
                onPrevious = if (!screen.instantFeedback && index > 0) { { index -= 1 } } else null,
                onNext = {
                    if (index < items.lastIndex) index += 1 else finish()
                },
            )
        }
    }

    if (confirmExit) {
        AlertDialog(
            onDismissRequest = { confirmExit = false },
            title = { Text("Leave this quiz?") },
            text = { Text("Your answers so far won't be saved.") },
            confirmButton = { TextButton(onClick = { confirmExit = false; nav.pop() }) { Text("Leave") } },
            dismissButton = { TextButton(onClick = { confirmExit = false }) { Text("Keep going") } },
        )
    }
}

@Composable
private fun QuestionPage(
    item: QuizItem,
    number: Int,
    total: Int,
    chapterLabel: String?,
    chosen: Int?,
    instantFeedback: Boolean,
    modifier: Modifier,
    onChoose: (Int) -> Unit,
    onPrevious: (() -> Unit)?,
    onNext: () -> Unit,
) {
    val revealed = instantFeedback && chosen != null
    val scroll = rememberScrollState()
    LaunchedEffect(number) { scroll.scrollTo(0) }
    Column(modifier.fillMaxWidth()) {
        LinearProgressIndicator(
            progress = { (number - 1) / total.toFloat() },
            modifier = Modifier.fillMaxWidth(),
        )
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(scroll)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Question $number of $total", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            if (chapterLabel != null) {
                Text(chapterLabel, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            RichText(item.question.prompt, style = MaterialTheme.typography.titleMedium)
            item.question.code?.let { CodeBlock(it) }
            Spacer(Modifier.height(4.dp))
            item.options.forEachIndexed { i, option ->
                OptionCard(
                    letter = "ABCDEFG"[i],
                    text = option,
                    state = when {
                        revealed && i == item.correct -> OptionState.Correct
                        revealed && i == chosen -> OptionState.Wrong
                        !revealed && i == chosen -> OptionState.Selected
                        else -> OptionState.Idle
                    },
                    enabled = !revealed,
                    onClick = { onChoose(i) },
                )
            }
            if (revealed) {
                val right = chosen == item.correct
                val extra = LocalExtraColors.current
                Card(colors = CardDefaults.cardColors(containerColor = if (right) extra.correctContainer else extra.wrongContainer)) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            if (right) "Correct" else "Not quite",
                            style = MaterialTheme.typography.titleSmall,
                            color = if (right) extra.correct else extra.wrong,
                        )
                        RichText(item.question.explain, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
        Surface(tonalElevation = 3.dp) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (onPrevious != null) {
                    OutlinedButton(onClick = onPrevious, modifier = Modifier.weight(1f)) { Text("Previous") }
                }
                Button(onClick = onNext, enabled = chosen != null, modifier = Modifier.weight(1f)) {
                    Text(if (number == total) "See results" else "Next")
                }
            }
        }
    }
}

private enum class OptionState { Idle, Selected, Correct, Wrong }

@Composable
private fun OptionCard(letter: Char, text: String, state: OptionState, enabled: Boolean, onClick: () -> Unit) {
    val extra = LocalExtraColors.current
    val scheme = MaterialTheme.colorScheme
    val container = when (state) {
        OptionState.Idle -> scheme.surfaceContainerHigh
        OptionState.Selected -> scheme.primaryContainer
        OptionState.Correct -> extra.correctContainer
        OptionState.Wrong -> extra.wrongContainer
    }
    val border = when (state) {
        OptionState.Idle -> null
        OptionState.Selected -> BorderStroke(2.dp, scheme.primary)
        OptionState.Correct -> BorderStroke(2.dp, extra.correct)
        OptionState.Wrong -> BorderStroke(2.dp, extra.wrong)
    }
    Card(
        onClick = onClick,
        enabled = enabled,
        border = border,
        colors = CardDefaults.cardColors(
            containerColor = container,
            disabledContainerColor = container,
            disabledContentColor = scheme.onSurface,
        ),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            Text("$letter", fontWeight = FontWeight.Bold, color = scheme.primary, modifier = Modifier.width(24.dp))
            RichText(text, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@Composable
private fun Results(
    quiz: List<QuizItem>,
    answers: Map<Int, Int>,
    modifier: Modifier,
    onRetake: () -> Unit,
    onDone: () -> Unit,
) {
    val correct = quiz.indices.count { answers[it] == quiz[it].correct }
    val pct = correct * 100 / quiz.size
    val extra = LocalExtraColors.current
    val missed = quiz.indices.filter { answers[it] != quiz[it].correct }
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = if (pct >= 80) extra.correctContainer else MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    Modifier.fillMaxWidth().padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text("$pct%", style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold)
                    Text("$correct of ${quiz.size} correct", style = MaterialTheme.typography.titleMedium)
                    Text(
                        when {
                            pct == 100 -> "Perfect score. You own this material."
                            pct >= 80 -> "Solid. You're ready to move on."
                            pct >= 60 -> "Getting there. Review the misses below and retake."
                            else -> "Go back through the study notes, then try again."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = onRetake, modifier = Modifier.weight(1f)) { Text("Retake") }
                Button(onClick = onDone, modifier = Modifier.weight(1f)) { Text("Done") }
            }
        }
        if (missed.isNotEmpty()) {
            item {
                Text("Review what you missed", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))
            }
            items(missed) { i -> ReviewCard(quiz[i], answers[i]) }
        }
    }
}

@Composable
private fun ReviewCard(item: QuizItem, chosen: Int?) {
    val extra = LocalExtraColors.current
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            RichText(item.question.prompt, style = MaterialTheme.typography.titleSmall)
            item.question.code?.let { CodeBlock(it) }
            if (chosen != null) {
                RichText("Your answer: ${item.options[chosen]}", style = MaterialTheme.typography.bodyMedium.copy(color = extra.wrong))
            }
            RichText("Correct: ${item.options[item.correct]}", style = MaterialTheme.typography.bodyMedium.copy(color = extra.correct, fontWeight = FontWeight.Medium))
            RichText(item.question.explain, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
