package com.questmullins.nspractice.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Quiz
import androidx.compose.material.icons.outlined.Style
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.questmullins.nspractice.Chapter
import com.questmullins.nspractice.ProgressStore

@Composable
fun ChapterScreen(ch: Chapter, progress: ProgressStore, nav: Navigator) {
    var tab by remember { mutableIntStateOf(0) }
    val listState = rememberLazyListState()
    LaunchedEffect(tab) { listState.scrollToItem(0) }
    Scaffold(
        topBar = {
            Column {
                BackTopBar("Chapter ${ch.id}", onBack = { nav.pop() })
                TabRow(selectedTabIndex = tab) {
                    listOf("Study", "Key points", "Lab").forEachIndexed { i, label ->
                        Tab(selected = tab == i, onClick = { tab = i }, text = { Text(label) })
                    }
                }
            }
        },
        bottomBar = {
            Surface(tonalElevation = 3.dp) {
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    OutlinedButton(onClick = { nav.push(Screen.Flashcards(ch.id)) }, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Outlined.Style, contentDescription = null)
                        Text("  Flashcards")
                    }
                    Button(
                        onClick = {
                            progress.markRead(ch.id)
                            nav.push(
                                Screen.Quiz(
                                    title = "Chapter ${ch.id} quiz",
                                    questionIds = ch.questions.map { it.id }.shuffled(),
                                    chapterId = ch.id,
                                    instantFeedback = true,
                                ),
                            )
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Outlined.Quiz, contentDescription = null)
                        Text("  Take quiz")
                    }
                }
            }
        },
    ) { padding ->
        LazyColumn(
            state = listState,
            modifier = Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Column {
                    Text(ch.week.uppercase(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                    Text(ch.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold)
                    Text(ch.subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            when (tab) {
                0 -> studyTab(ch, progress) { tab = 1 }
                1 -> keyPointsTab(ch)
                else -> labTab(ch)
            }
        }
    }
}

private fun LazyListScope.studyTab(ch: Chapter, progress: ProgressStore, onDone: () -> Unit) {
    itemsIndexed(ch.sections) { i, section ->
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(
                "${i + 1}. ${section.title}",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 6.dp),
            )
            section.blocks.forEach { BlockView(it) }
        }
    }
    item {
        val read = progress.isRead(ch.id)
        FilledTonalButton(
            onClick = { progress.markRead(ch.id); onDone() },
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        ) {
            if (read) Icon(Icons.Filled.Check, contentDescription = null)
            Text(if (read) "  Studied · review key points" else "I've studied this · show key points")
        }
    }
}

private fun LazyListScope.keyPointsTab(ch: Chapter) {
    item {
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Remember these", style = MaterialTheme.typography.titleMedium)
                BulletList(ch.takeaways, numbered = false)
            }
        }
    }
    item {
        Text(
            "Then flip through the flashcards and take the quiz. Aim for 80% or better before moving on.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private fun LazyListScope.labTab(ch: Chapter) {
    item {
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Hands-on lab", style = MaterialTheme.typography.labelMedium)
                Text(ch.lab.title, style = MaterialTheme.typography.titleMedium)
                RichText(ch.lab.goal, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
    item { BulletList(ch.lab.steps, numbered = true) }
    item { Callout("Do labs in a sandbox or developer account. Keep script deployments in Testing status until they work.", warn = true) }
}
