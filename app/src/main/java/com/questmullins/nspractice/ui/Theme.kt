package com.questmullins.nspractice.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

private val Navy = Color(0xFF1F3A5F)
private val Amber = Color(0xFFFFB547)

private val LightColors = lightColorScheme(
    primary = Navy,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD6E3F5),
    onPrimaryContainer = Color(0xFF0B1F38),
    secondary = Color(0xFF8A5A00),
    secondaryContainer = Color(0xFFFFE2B5),
    onSecondaryContainer = Color(0xFF2B1A00),
    background = Color(0xFFF5F7FA),
    surface = Color(0xFFF5F7FA),
    surfaceVariant = Color(0xFFE3E8EF),
    surfaceContainer = Color(0xFFEDF1F6),
    surfaceContainerHigh = Color(0xFFE6EBF2),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFA9C7F0),
    onPrimary = Color(0xFF0B1F38),
    primaryContainer = Color(0xFF2B4B74),
    onPrimaryContainer = Color(0xFFD6E3F5),
    secondary = Amber,
    secondaryContainer = Color(0xFF5C3D00),
    onSecondaryContainer = Color(0xFFFFE2B5),
    background = Color(0xFF10151C),
    surface = Color(0xFF10151C),
    surfaceVariant = Color(0xFF2A323D),
    surfaceContainer = Color(0xFF1A212B),
    surfaceContainerHigh = Color(0xFF222A35),
)

/** Colors the Material scheme doesn't cover: right/wrong answers, callouts, code. */
@Immutable
data class ExtraColors(
    val correct: Color,
    val correctContainer: Color,
    val wrong: Color,
    val wrongContainer: Color,
    val tipContainer: Color,
    val warnContainer: Color,
    val codeBackground: Color,
    val codeText: Color,
    val inlineCode: Color,
)

private val LightExtra = ExtraColors(
    correct = Color(0xFF1B7F3B),
    correctContainer = Color(0xFFD7F2DF),
    wrong = Color(0xFFB3261E),
    wrongContainer = Color(0xFFF9DEDC),
    tipContainer = Color(0xFFDDEBFF),
    warnContainer = Color(0xFFFFEBC7),
    codeBackground = Color(0xFF16202C),
    codeText = Color(0xFFE6EDF5),
    inlineCode = Color(0xFFE3E8EF),
)

private val DarkExtra = ExtraColors(
    correct = Color(0xFF7FD69A),
    correctContainer = Color(0xFF173D24),
    wrong = Color(0xFFF2B8B5),
    wrongContainer = Color(0xFF4A1C1A),
    tipContainer = Color(0xFF1C2E47),
    warnContainer = Color(0xFF3D2E10),
    codeBackground = Color(0xFF0A0F15),
    codeText = Color(0xFFE6EDF5),
    inlineCode = Color(0xFF2A323D),
)

val LocalExtraColors = staticCompositionLocalOf { LightExtra }

@Composable
fun NsTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    androidx.compose.runtime.CompositionLocalProvider(LocalExtraColors provides if (dark) DarkExtra else LightExtra) {
        MaterialTheme(colorScheme = if (dark) DarkColors else LightColors, content = content)
    }
}
