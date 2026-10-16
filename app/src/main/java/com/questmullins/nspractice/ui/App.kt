package com.questmullins.nspractice.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Quiz
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Style
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.questmullins.nspractice.Chapter
import com.questmullins.nspractice.Content
import com.questmullins.nspractice.Launch
import com.questmullins.nspractice.ProgressStore

sealed interface Screen {
    data object Home : Screen
    data class ChapterDetail(val chapterId: Int) : Screen
    data class Flashcards(val chapterId: Int?) : Screen
    data object TestSetup : Screen
    data object Glossary : Screen
    data class Quiz(
        val title: String,
        val questionIds: List<String>,
        val chapterId: Int?,
        val instantFeedback: Boolean,
        val nonce: Long = System.nanoTime(),
    ) : Screen
}

class Navigator {
    val stack = mutableStateListOf<Screen>(Screen.Home)
    val current: Screen get() = stack.last()
    fun push(screen: Screen) { stack.add(screen) }
    fun replace(screen: Screen) { stack[stack.lastIndex] = screen }
    fun pop() { if (stack.size > 1) stack.removeAt(stack.lastIndex) }
}

@Composable
fun App(content: Content, progress: ProgressStore) {
    NsTheme {
        val nav = remember { Navigator() }
        BackHandler(enabled = nav.stack.size > 1 && nav.current !is Screen.Quiz) { nav.pop() }
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            when (val s = nav.current) {
                Screen.Home -> HomeScreen(content, progress, nav)
                is Screen.ChapterDetail -> ChapterScreen(content.chapter(s.chapterId), content, progress, nav)
                is Screen.Flashcards -> FlashcardsScreen(content, s.chapterId, nav)
                Screen.TestSetup -> TestSetupScreen(content, progress, nav)
                Screen.Glossary -> GlossaryScreen(content, nav)
                is Screen.Quiz -> QuizScreen(content, progress, s, nav)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BackTopBar(title: String, onBack: () -> Unit, actions: @Composable () -> Unit = {}) {
    TopAppBar(
        title = { Text(title, maxLines = 1) },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
        },
        actions = { actions() },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.primary,
            titleContentColor = MaterialTheme.colorScheme.onPrimary,
            navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
            actionIconContentColor = MaterialTheme.colorScheme.onPrimary,
        ),
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeScreen(content: Content, progress: ProgressStore, nav: Navigator) {
    val context = LocalContext.current
    var confirmReset by remember { mutableStateOf(false) }
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("NS Practice", fontWeight = FontWeight.SemiBold)
                        Text("NetSuite backend development", style = MaterialTheme.typography.labelMedium)
                    }
                },
                actions = {
                    IconButton(onClick = { confirmReset = true }) {
                        Icon(Icons.Outlined.Refresh, contentDescription = "Reset progress")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary,
                ),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { ProgressSummary(content, progress, nav) }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ActionTile("Random test", "Mixed questions", Icons.Outlined.Quiz, Modifier.weight(1f)) {
                            nav.push(Screen.TestSetup)
                        }
                        ActionTile("Flashcards", "All chapters", Icons.Outlined.Style, Modifier.weight(1f)) {
                            nav.push(Screen.Flashcards(null))
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ActionTile("Code Lab", "Write SuiteScript", Icons.Outlined.Code, Modifier.weight(1f)) {
                            Launch.codeLab(context)
                        }
                        ActionTile("Glossary", "${content.glossary.size} terms", Icons.AutoMirrored.Outlined.MenuBook, Modifier.weight(1f)) {
                            nav.push(Screen.Glossary)
                        }
                    }
                }
            }
            item {
                Text(
                    "Chapters",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
            items(content.chapters, key = { it.id }) { ch ->
                ChapterRow(ch, progress) { nav.push(Screen.ChapterDetail(ch.id)) }
            }
            item {
                Text(
                    "Code Lab runs against a pretend NetSuite account, so you can practice without one.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                )
            }
        }
    }
    if (confirmReset) {
        AlertDialog(
            onDismissRequest = { confirmReset = false },
            title = { Text("Reset progress?") },
            text = { Text("This clears chapters read, quiz scores, test history and your missed-question pile.") },
            confirmButton = {
                TextButton(onClick = { progress.reset(); confirmReset = false }) { Text("Reset") }
            },
            dismissButton = { TextButton(onClick = { confirmReset = false }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun ProgressSummary(content: Content, progress: ProgressStore, nav: Navigator) {
    val read = content.chapters.count { progress.isRead(it.id) }
    val scores = content.chapters.mapNotNull { progress.bestScore(it.id) }
    val history = progress.history()
    val missed = progress.missedIds().count { content.question(it) != null }
    val labsPassed = content.challenges.count { progress.labStatus(it.id) == "passed" }
    val next = content.chapters.firstOrNull { !progress.isRead(it.id) }
        ?: content.chapters.firstOrNull { (progress.bestScore(it.id) ?: 0) < 80 }
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Your progress", style = MaterialTheme.typography.titleMedium)
            LinearProgressIndicator(
                progress = { read / content.chapters.size.toFloat() },
                modifier = Modifier.fillMaxWidth().height(8.dp),
            )
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Stat("$read/${content.chapters.size}", "studied")
                Stat(if (scores.isEmpty()) "–" else "${scores.average().toInt()}%", "avg quiz")
                Stat("${history.size}", "tests")
                Stat("$labsPassed/${content.challenges.size}", "code labs")
            }
            if (next != null) {
                Text(
                    "Up next: Chapter ${next.id}, ${next.title}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.clickable { nav.push(Screen.ChapterDetail(next.id)) },
                )
            }
            if (missed > 0) {
                TextButton(
                    onClick = {
                        val ids = progress.missedIds().filter { content.question(it) != null }.shuffled().take(20)
                        nav.push(Screen.Quiz("Review missed", ids, null, instantFeedback = true))
                    },
                    contentPadding = PaddingValues(0.dp),
                ) { Text("Review $missed missed question${if (missed == 1) "" else "s"}") }
            }
        }
    }
}

@Composable
private fun Stat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun ActionTile(title: String, subtitle: String, icon: ImageVector, modifier: Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
            Text(title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
            Text(subtitle, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
        }
    }
}

@Composable
private fun ChapterRow(ch: Chapter, progress: ProgressStore, onClick: () -> Unit) {
    val best = progress.bestScore(ch.id)
    val read = progress.isRead(ch.id)
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .padding(end = 0.dp),
                contentAlignment = Alignment.Center,
            ) {
                Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("${ch.id}", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(Modifier.size(14.dp))
            Column(Modifier.weight(1f)) {
                Text(ch.title, style = MaterialTheme.typography.titleSmall)
                Text(
                    "${ch.week} · ${ch.subtitle}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    if (best == null) "${ch.questions.size} quiz questions" else "Best quiz: $best%",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (best != null && best >= 80) LocalExtraColors.current.correct else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (read) {
                Icon(Icons.Filled.CheckCircle, contentDescription = "Studied", tint = LocalExtraColors.current.correct)
            }
        }
    }
}
