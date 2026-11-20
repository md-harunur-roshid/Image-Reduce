import JSZip from 'jszip';
import { Download, Laptop, Smartphone, Terminal, X } from 'lucide-react';
import { useState } from 'react';

interface DesktopExportModalProps {
  lang: 'bn' | 'en';
  targetUrl: string;
  open: boolean;
  onClose: () => void;
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DesktopExportModal({
  lang,
  targetUrl,
  open,
  onClose,
}: DesktopExportModalProps) {
  const [buildingZip, setBuildingZip] = useState<'electron' | 'android' | null>(
    null
  );

  if (!open) return null;

  const handleDownloadAndroidZip = async () => {
    setBuildingZip('android');
    try {
      const zip = new JSZip();

      const settingsGradle = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "ChatDesk"
include(":app")
`;

      const rootBuildGradle = `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`;

      const gradleProps = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

      const appBuildGradle = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.hptelecom.chatdesk"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.hptelecom.chatdesk"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
}
`;

      const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.DayNight.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

      const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ChatDesk</string>
</resources>
`;

      const mainActivityKt = `package com.hptelecom.chatdesk

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val targetUrl = "${targetUrl}"

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val results = if (result.resultCode == RESULT_OK) {
                result.data?.data?.let { arrayOf(it) }
            } else null
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            userAgentString = userAgentString.replace("; wv", "")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith(targetUrl)) {
                    return false
                }
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                val intent = fileChooserParams?.createIntent() ?: return false
                fileChooserLauncher.launch(intent)
                return true
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        webView.loadUrl(targetUrl)
    }
}
`;

      const ghWorkflow = `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: android-actions/setup-android@v3
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: 8.7
      - name: Build Debug APK
        run: gradle assembleDebug --no-daemon
      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ChatDesk-APK
          path: app/build/outputs/apk/debug/app-debug.apk
`;

      const readme = `ChatDesk Android APK Project
============================
Target URL: ${targetUrl}

Option A (No Android Studio Needed — Free Cloud APK Build via GitHub):
1. Extract this ZIP and upload all files (including .github/workflows/build-apk.yml) to a GitHub repository.
2. Open the "Actions" tab in GitHub -> run "Build Android APK".
3. In ~2 minutes, download "ChatDesk-APK" (app-debug.apk) directly from the workflow artifacts!

Option B (Using Android Studio on PC):
1. Open this extracted folder in Android Studio.
2. Wait for Gradle Sync to finish.
3. Click Build -> Build Bundle(s) / APK(s) -> Build APK(s).
`;

      zip.file('settings.gradle.kts', settingsGradle);
      zip.file('build.gradle.kts', rootBuildGradle);
      zip.file('gradle.properties', gradleProps);
      zip.file('app/build.gradle.kts', appBuildGradle);
      zip.file('app/proguard-rules.pro', '');
      zip.file('app/src/main/AndroidManifest.xml', manifestXml);
      zip.file('app/src/main/res/values/strings.xml', stringsXml);
      zip.file(
        'app/src/main/java/com/hptelecom/chatdesk/MainActivity.kt',
        mainActivityKt
      );
      zip.file('.github/workflows/build-apk.yml', ghWorkflow);
      zip.file('README.txt', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ChatDesk-Android-APK-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBuildingZip(null);
    }
  };

  const handleDownloadWindowsBat = () => {
    const bat = `@echo off
title ChatDesk App Launcher
set TARGET_URL=${targetUrl}

where msedge >nul 2>&1
if %errorlevel%==0 (
  start "" msedge --app="%TARGET_URL%"
  exit /b
)

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%TARGET_URL%"
  exit /b
)

if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%TARGET_URL%"
  exit /b
)

if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" (
  start "" "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" --app="%TARGET_URL%"
  exit /b
)

start "" "%TARGET_URL%"
`;
    downloadTextFile('ChatDesk-Windows-App.bat', bat);
  };

  const handleDownloadMacCommand = () => {
    const sh = `#!/bin/bash
TARGET_URL="${targetUrl}"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$TARGET_URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$TARGET_URL"
else
  open "$TARGET_URL"
fi
`;
    downloadTextFile('ChatDesk-Mac-App.command', sh);
  };

  const handleDownloadElectronZip = async () => {
    setBuildingZip('electron');
    try {
      const zip = new JSZip();

      const pkg = {
        name: 'chatdesk-desktop',
        version: '1.0.0',
        description: `Standalone desktop software for ${targetUrl}`,
        main: 'main.js',
        scripts: {
          start: 'electron .',
          'build:win': 'electron-builder --win',
          'build:mac': 'electron-builder --mac',
          'build:linux': 'electron-builder --linux',
        },
        build: {
          appId: 'com.hptelecom.chatdesk',
          productName: 'ChatDesk',
          win: { target: 'nsis' },
          mac: { target: 'dmg' },
          linux: { target: 'AppImage' },
        },
        devDependencies: {
          electron: '^33.0.0',
          'electron-builder': '^25.1.8',
        },
      };

      const mainJs = `const { app, BrowserWindow, shell, Menu } = require('electron');

const TARGET_URL = '${targetUrl}';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 420,
    minHeight: 600,
    title: 'ChatDesk',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadURL(TARGET_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(targetUrl)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

      const readme = `ChatDesk Desktop Software (Electron)
=====================================
Target URL: ${targetUrl}

1. Install Node.js (v18+): https://nodejs.org
2. Extract this ZIP folder and open a terminal inside it.
3. Run:
   npm install
   npm start

To build an installable Windows .exe installer:
   npm run build:win

To build a macOS .dmg installer:
   npm run build:mac
`;

      zip.file('package.json', JSON.stringify(pkg, null, 2));
      zip.file('main.js', mainJs);
      zip.file('README.txt', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ChatDesk-Electron-Desktop.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBuildingZip(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {lang === 'bn'
                ? 'অ্যান্ড্রয়েড APK ও ডেস্কটপ সফটওয়্যার'
                : 'Android APK & Desktop Software'}
            </h2>
            <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
              {targetUrl}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Option 1: Android APK Project + GitHub Actions Auto-Builder */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'অ্যান্ড্রয়েড APK প্রজেক্ট (.ZIP)'
                    : 'Android APK Project (.ZIP)'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'সম্পূর্ণ Kotlin WebView সোর্স + GitHub Actions অটো-বিল্ড ফাইল। GitHub-এ আপলোড করলেই স্বয়ংক্রিয়ভাবে app-debug.apk তৈরি হয়ে যাবে (অথবা Android Studio-তে সরাসরি Build APK করুন)।'
                  : 'Complete Kotlin WebView project + GitHub Actions workflow. Push to GitHub to auto-build app-debug.apk in the cloud, or open in Android Studio.'}
              </p>
            </div>
            <button
              type="button"
              disabled={buildingZip !== null}
              onClick={handleDownloadAndroidZip}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{buildingZip === 'android' ? '...' : 'APK .ZIP'}</span>
            </button>
          </div>

          {/* Option 2: Instant Windows .bat Launcher */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'উইন্ডোজ অ্যাপ লঞ্চার (.bat)'
                    : 'Windows App Launcher (.bat)'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'ডাউনলোড করে ডাবল-ক্লিক করলেই ব্রাউজারের ট্যাব ও অ্যাড্রেস বার ছাড়া সরাসরি সফটওয়্যার উইন্ডোতে ওপেন হবে।'
                  : 'Double-click on Windows to launch in a clean, frameless software window with no tabs or URL bar.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadWindowsBat}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>.BAT</span>
            </button>
          </div>

          {/* Option 3: macOS .command Launcher */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Laptop className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'ম্যাকওএস অ্যাপ লঞ্চার (.command)'
                    : 'macOS App Launcher (.command)'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'Mac কম্পিউটারে আলাদা অ্যাপ উইন্ডো হিসেবে চালানোর লঞ্চার স্ক্রিপ্ট।'
                  : 'Launches your chat web app in a standalone Chrome/Edge app window on macOS.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadMacCommand}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>.COMMAND</span>
            </button>
          </div>

          {/* Option 4: Full Electron Desktop Software (.ZIP) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'ইলেকট্রন ডেস্কটপ সফটওয়্যার (.ZIP)'
                    : 'Electron Desktop Source (.ZIP)'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'সম্পূর্ণ Electron প্রোজেক্ট—যার মাধ্যমে নিজেই Windows (.exe), Mac (.dmg) বা Linux সফটওয়্যার বিল্ড করতে পারবেন।'
                  : 'Complete Electron project configured for your URL—run locally or compile into a .exe / .dmg installer.'}
              </p>
            </div>
            <button
              type="button"
              disabled={buildingZip !== null}
              onClick={handleDownloadElectronZip}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{buildingZip === 'electron' ? '...' : '.ZIP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
