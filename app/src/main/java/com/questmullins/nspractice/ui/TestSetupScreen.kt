package com.questmullins.nspractice.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.questmullins.nspractice.Content
import com.questmullins.nspractice.ProgressStore
import java.text.DateFormat
import java.util.Date

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun TestSetupScreen(content: Content, progress: ProgressStore, nav: Navigator) {
    val counts = listOf(10, 20, 30, 50)
    var count by remember { mutableIntStateOf(20) }
    val selected = remember { mutableStateListOf<Int>().apply { addAll(content.chapters.map { it.id }) } }
    var instant by remember { mutableStateOf(false) }
    val pool = content.allQuestions.filter { it.chapterId in selected }
    val history = progress.history()

    Scaffold(topBar = { BackTopBar("Random test", onBack = { nav.pop() }) }) { padding ->
        Column(
            Modifier
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("How many questions?", style = MaterialTheme.typography.titleMedium)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                counts.forEach { n ->
                    FilterChip(selected = count == n, onClick = { count = n }, label = { Text("$n") })
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Chapters", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                TextButton(onClick = {
                    if (selected.size == content.chapters.size) selected.clear()
                    else { selected.clear(); selected.addAll(content.chapters.map { it.id }) }
                }) { Text(if (selected.size == content.chapters.size) "Clear all" else "Select all") }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                content.chapters.forEach { ch ->
                    FilterChip(
                        selected = ch.id in selected,
                        onClick = { if (ch.id in selected) selected.remove(ch.id) else selected.add(ch.id) },
                        label = { Text("${ch.id}. ${ch.title}") },
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Show answers as I go", style = MaterialTheme.typography.titleMedium)
                    Text(
                        if (instant) "Practice mode: see the explanation after each question."
                        else "Exam mode: answers and explanations at the end.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Switch(checked = instant, onCheckedChange = { instant = it })
            }

            Button(
                onClick = {
                    val ids = pool.shuffled().take(count).map { it.id }
                    nav.push(Screen.Quiz("Random test", ids, null, instant))
                },
                enabled = pool.isNotEmpty(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (pool.isEmpty()) "Pick at least one chapter" else "Start ${minOf(count, pool.size)} questions")
            }

            if (history.isNotEmpty()) {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
                    Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Recent tests", style = MaterialTheme.typography.titleSmall)
                        val fmt = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT)
                        history.takeLast(8).reversed().forEach { t ->
                            Row {
                                Text(fmt.format(Date(t.timestamp)), style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                                Text("${t.correct}/${t.total} · ${t.percent}%", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}
