plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.questmullins.nspractice"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.questmullins.nspractice"
        minSdk = 26
        targetSdk = 34
        // CI passes the run number so every build can install over the last one.
        val build = (project.findProperty("buildNumber") as String?)?.toInt() ?: 1
        versionCode = build
        versionName = "1.0.$build"
    }

    signingConfigs {
        // A key dedicated to this personal study app, kept in the repo so every
        // CI build is signed the same way and installs as an update.
        create("study") {
            storeFile = file("ns-practice.keystore")
            storePassword = "nspractice"
            keyAlias = "nspractice"
            keyPassword = "nspractice"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("study")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.02")
    implementation(composeBom)
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
}
