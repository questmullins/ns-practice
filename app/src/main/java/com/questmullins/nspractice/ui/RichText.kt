package com.questmullins.nspractice.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.questmullins.nspractice.Block

/** Turns **bold** and `code` markup into styled text. */
fun markup(text: String, codeBackground: Color): AnnotatedString = buildAnnotatedString {
    var bold = false
    var code = false
    val buf = StringBuilder()
    fun flush() {
        if (buf.isEmpty()) return
        val style = SpanStyle(
            fontWeight = if (bold) FontWeight.SemiBold else null,
            fontFamily = if (code) FontFamily.Monospace else null,
            background = if (code) codeBackground else Color.Unspecified,
        )
        withStyle(style) { append(buf.toString()) }
        buf.clear()
    }
    var i = 0
    while (i < text.length) {
        when {
            text.startsWith("**", i) && !code -> { flush(); bold = !bold; i += 2 }
            text[i] == '`' -> { flush(); code = !code; i++ }
            else -> { buf.append(text[i]); i++ }
        }
    }
    flush()
}

@Composable
fun RichText(text: String, modifier: Modifier = Modifier, style: androidx.compose.ui.text.TextStyle = MaterialTheme.typography.bodyLarge) {
    val bg = LocalExtraColors.current.inlineCode
    val annotated = remember(text, bg) { markup(text, bg) }
    Text(annotated, modifier = modifier, style = style)
}

@Composable
fun CodeBlock(code: String, modifier: Modifier = Modifier) {
    val extra = LocalExtraColors.current
    Text(
        text = code,
        color = extra.codeText,
        fontFamily = FontFamily.Monospace,
        fontSize = 12.5.sp,
        lineHeight = 18.sp,
        softWrap = false,
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(extra.codeBackground)
            .horizontalScroll(rememberScrollState())
            .padding(12.dp),
    )
}

@Composable
fun Callout(text: String, warn: Boolean) {
    val extra = LocalExtraColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(if (warn) extra.warnContainer else extra.tipContainer)
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(
            if (warn) Icons.Outlined.WarningAmber else Icons.Outlined.Lightbulb,
            contentDescription = if (warn) "Watch out" else "Tip",
        )
        RichText(text, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun BulletList(items: List<String>, numbered: Boolean) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        items.forEachIndexed { i, item ->
            Row {
                Text(
                    if (numbered) "${i + 1}." else "•",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.width(if (numbered) 26.dp else 18.dp),
                )
                RichText(item)
            }
        }
    }
}

@Composable
fun DataTable(rows: List<List<String>>) {
    if (rows.isEmpty()) return
    val cols = rows.maxOf { it.size }
    val colWidth = if (cols <= 2) 170.dp else 150.dp
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.surfaceContainer)
            .horizontalScroll(rememberScrollState()),
    ) {
        rows.forEachIndexed { r, row ->
            Row(
                modifier = if (r == 0) Modifier.background(MaterialTheme.colorScheme.primaryContainer) else Modifier,
                verticalAlignment = Alignment.Top,
            ) {
                row.forEach { cell ->
                    RichText(
                        cell,
                        style = if (r == 0) {
                            MaterialTheme.typography.labelLarge.copy(color = MaterialTheme.colorScheme.onPrimaryContainer)
                        } else {
                            MaterialTheme.typography.bodyMedium
                        },
                        modifier = Modifier.width(colWidth).padding(horizontal = 10.dp, vertical = 8.dp),
                    )
                }
            }
            if (r > 0 && r < rows.lastIndex) HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
        }
    }
}

@Composable
fun BlockView(block: Block) {
    when (block.type) {
        "p" -> RichText(block.text)
        "bullets" -> BulletList(block.items, numbered = false)
        "steps" -> BulletList(block.items, numbered = true)
        "code" -> CodeBlock(block.text)
        "table" -> DataTable(block.rows)
        "tip" -> Callout(block.text, warn = false)
        "warn" -> Callout(block.text, warn = true)
        else -> RichText(block.text)
    }
}
