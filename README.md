# NS Practice

An offline Android study app for NetSuite backend development: 10 chapters built on the
NetSuite Backend Primer's 8-week learning path, with study notes, hands-on labs,
flashcards, chapter quizzes, random tests and a glossary.

## Install on your phone

1. Open the [latest release](../../releases/latest) on your Android phone.
2. Download **NS-Practice.apk** and open it.
3. If Android asks, allow installs from your browser (or Files app) for this one app.

Each push to `main` builds a new APK and publishes it as a release. New builds install
over the old one and keep your progress.

## What's inside

| | |
|---|---|
| Chapters | 1 Mental model · 2 Records & IDs · 3 No-code customization · 4 Saved searches & SuiteQL · 5 SuiteScript basics · 6 Script types · 7 N/ modules · 8 Governance & Map/Reduce · 9 Workflows, Suitelets & integrations · 10 SDF & environments |
| Each chapter | Study notes with code samples, key points, a hands-on lab, flashcards, a quiz |
| Random test | Pick 10–50 questions from any chapters, exam mode or answers-as-you-go |
| Review missed | Questions you got wrong come back until you get them right |
| Glossary | Searchable NetSuite terms |

Progress is stored on the device only.

## Editing the content

All course content lives in `content/` as Python files (one per group of chapters).
Questions are written with the correct answer first; the app shuffles the options.

```bash
python3 content/build_content.py   # regenerates app/src/main/assets/content.json
```

CI runs this before every build, so editing the Python files is enough.

## Building locally

Needs JDK 17 and the Android SDK (API 34). Open the folder in Android Studio, or run
`./gradlew assembleRelease`. The APK lands in `app/build/outputs/apk/release/`.

The app is signed with `app/ns-practice.keystore`, a key made only for this personal
study app so every build installs as an update.
