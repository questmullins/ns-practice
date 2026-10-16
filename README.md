# NS Practice

An offline Android study app for NetSuite backend development: a JavaScript starter
chapter plus 10 chapters built on the NetSuite Backend Primer's 8-week learning path, with
study notes, flashcards, chapter quizzes, random tests, a glossary, and **NS Code Lab**, a
SuiteScript editor that runs your code against a pretend NetSuite account.

## Install on your phone

1. Open the [latest release](../../releases/latest) on your Android phone.
2. Download **NS-Practice.apk** and open it.
3. If Android asks, allow installs from your browser (or Files app) for this one app.

Each push to `main` builds a new APK and publishes it as a release. New builds install
over the old one and keep your progress.

## What's inside

| | |
|---|---|
| Chapters | 0 JavaScript from zero · 1 Mental model · 2 Records & IDs · 3 No-code customization · 4 Saved searches & SuiteQL · 5 SuiteScript basics · 6 Script types · 7 N/ modules · 8 Governance & Map/Reduce · 9 Workflows, Suitelets & integrations · 10 SDF & environments |
| Each chapter | Study notes with code samples, key points, Code Lab challenges, a real-account lab for later, flashcards, a quiz |
| Code Lab | 31 graded SuiteScript challenges plus a free playground, run against mock NetSuite data |
| Random test | Pick 10–50 questions from any chapters, exam mode or answers-as-you-go |
| Review missed | Questions you got wrong come back until you get them right |
| Glossary | Searchable NetSuite terms |

Progress is stored on the device only.

## NS Code Lab

Installing the APK adds a second launcher icon, **NS Code Lab**. It is a JavaScript
(SuiteScript 2.1) editor that runs your script against a simulated NetSuite account:
customers, items, sales orders, invoices and more, with mock versions of `N/record`,
`N/search`, `N/query` (SuiteQL), `N/log`, `N/runtime`, `N/email`, `N/https`, `N/task`,
`N/ui/serverWidget` and others, plus governance-unit limits per script type. Each
challenge is graded, and passes show up as check marks in the study app.

It is a teaching simulation, not NetSuite. Behaviour is close for the common calls but
not identical, and nothing you write touches a real account.

**Side by side:** open recent apps, tap the NS Practice icon on its card, choose split
screen, then pick NS Code Lab. On a foldable or tablet, *Open in Code Lab* on a
chapter's Practice tab opens it beside the study app.

The page lives in `app/src/main/assets/codelab/` and also runs in any browser
(`python3 -m http.server` in that folder). Challenges are in `challenges.js`; check that
every solution passes and every starter fails with:

```bash
node content/export_challenges.js   # regenerates app/src/main/assets/challenges.json
node codelab-tests/run-tests.js
```

Code Lab bundles [AlaSQL](https://github.com/AlaSQL/alasql) (MIT License, © 2014-2024
Andrey Gershun & Mathias Wulff) for SuiteQL.

## Editing the content

All course content lives in `content/` as Python files (one per group of chapters).
Questions are written with the correct answer first; the app shuffles the options.

```bash
python3 content/build_content.py   # regenerates app/src/main/assets/content.json
```

CI runs this (and the Code Lab export and tests) before every build, so editing the source files is enough.

## Building locally

Needs JDK 17 and the Android SDK (API 34). Open the folder in Android Studio, or run
`./gradlew assembleRelease`. The APK lands in `app/build/outputs/apk/release/`.

The app is signed with `app/ns-practice.keystore`, a key made only for this personal
study app so every build installs as an update.
