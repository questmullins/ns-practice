package com.questmullins.nspractice.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Shuffle
import androidx.compose.material3.Button
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.questmullins.nspractice.Content
import com.questmullins.nspractice.Flashcard

private data class DeckCard(val chapterId: Int, val card: Flashcard)

@Composable
fun FlashcardsScreen(content: Content, chapterId: Int?, nav: Navigator) {
    val all = remember(chapterId) {
        content.chapters
            .filter { chapterId == null || it.id == chapterId }
            .flatMap { ch -> ch.flashcards.map { DeckCard(ch.id, it) } }
    }
    var deck by remember(chapterId) { mutableStateOf(if (chapterId == null) all.shuffled() else all) }
    var index by remember(chapterId) { mutableIntStateOf(0) }
    var flipped by remember(chapterId) { mutableStateOf(false) }
    val rotation by animateFloatAsState(if (flipped) 180f else 0f, animationSpec = tween(350), label = "flip")
    val current = deck[index]

    fun go(to: Int) {
        flipped = false
        index = to
    }

    Scaffold(
        topBar = {
            BackTopBar(
                if (chapterId == null) "Flashcards · all chapters" else "Flashcards · Chapter $chapterId",
                onBack = { nav.pop() },
            ) {
                IconButton(onClick = { deck = deck.shuffled(); go(0) }) {
                    Icon(Icons.Outlined.Shuffle, contentDescription = "Shuffle")
                }
            }
        },
    ) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            LinearProgressIndicator(progress = { (index + 1) / deck.size.toFloat() }, modifier = Modifier.fillMaxWidth())
            Text(
                "Card ${index + 1} of ${deck.size} · Chapter ${current.chapterId}: ${content.chapter(current.chapterId).title}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Box(
                Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .graphicsLayer {
                        rotationY = rotation
                        cameraDistance = 12f * density
                    }
                    .clickable { flipped = !flipped },
            ) {
                val showBack = rotation > 90f
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (showBack) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.primaryContainer,
                    tonalElevation = 2.dp,
                    modifier = Modifier.fillMaxSize(),
                ) {
                    Column(
                        Modifier
                            .fillMaxSize()
                            .graphicsLayer { rotationY = if (showBack) 180f else 0f }
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            if (showBack) "ANSWER" else "TERM",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        RichText(
                            if (showBack) current.card.back else current.card.front,
                            style = if (showBack) MaterialTheme.typography.titleMedium.copy(textAlign = TextAlign.Center)
                            else MaterialTheme.typography.headlineSmall.copy(textAlign = TextAlign.Center),
                            modifier = Modifier.padding(top = 12.dp),
                        )
                        if (!showBack) {
                            Text(
                                "Tap to flip",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 24.dp),
                            )
                        }
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = { go(index - 1) }, enabled = index > 0, modifier = Modifier.weight(1f)) {
                    Text("Previous")
                }
                Button(
                    onClick = { if (index < deck.lastIndex) go(index + 1) else { deck = deck.shuffled(); go(0) } },
                    modifier = Modifier.weight(1f),
                ) {
                    Text(if (index < deck.lastIndex) "Next" else "Shuffle & restart")
                }
            }
        }
    }
}
