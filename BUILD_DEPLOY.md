# Sports App 构建与部署文档

## 📱 项目简介

体育科技风 React Native App，包含首页、资讯、比分、我的 4 个底部 Tab 模块。

---

## 一、环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18 | 运行 JavaScript 环境 |
| JDK | >= 17 | Android 编译需要 |
| Android SDK | API 34+ | 编译 Android 应用 |
| Gradle | 8.x+ | Android 构建工具 |
| npm / yarn | 任意 | 包管理 |

## 二、环境搭建

### 1. 安装 Node.js

下载安装：https://nodejs.org/ (推荐 LTS 版本)

验证安装：
```bash
node --version
npm --version
```

### 2. 安装 Java JDK

下载安装：https://adoptium.net/ (推荐 JDK 21 LTS)

验证安装：
```bash
java -version
```

### 3. 安装 Android Studio

下载安装：https://developer.android.com/studio

安装时勾选 **Android SDK**、**Android SDK Platform**、**Android Virtual Device**。

安装完成后，在 Android Studio 中通过 SDK Manager 安装：

- Android SDK Platform 34 或 35
- Android SDK Build-Tools 34+

### 4. 配置环境变量

**Windows 系统** 设置系统环境变量：

| 变量名 | 示例值 |
|--------|--------|
| `ANDROID_HOME` | `D:\install\andorid Studio\sdk` |
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-21.0.x` |
| `PATH` 追加 | `%ANDROID_HOME%\platform-tools` |
| `PATH` 追加 | `%ANDROID_HOME%\tools` |
| `PATH` 追加 | `%ANDROID_HOME%\tools\bin` |

---

## 三、项目运行

### 1. 安装依赖

```bash
# 进入项目目录
cd sports-app

# 安装 npm 依赖
npm install

# 如果使用 yarn
yarn install
```

### 2. 配置 Android SDK 路径

在 `android/` 目录下创建 `local.properties` 文件，写入：

```
sdk.dir=D\\:\\install\\andorid Studio\\sdk
```

> 注意：路径格式使用双反斜杠，Android 系统版本号写自己安装的版本。

### 3. 启动 Metro（开发打包服务）

```bash
npx react-native start
```

### 4. 运行到 Android 设备/模拟器

**新终端窗口运行：**

```bash
npx react-native run-android
```

> 确保 Android 模拟器已启动，或通过 USB 连接了真机并开启 USB 调试。

---

## 四、构建 APK

### 4.1 生成签名密钥（已有可跳过）

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass sports2024 -keypass sports2024 \
  -dname "CN=SportsApp, OU=Sports, O=SportsApp, L=Beijing, ST=Beijing, C=CN"
```

> **注意**：生产环境请使用自己的密钥信息，不要使用示例密码。

### 4.2 构建 Release APK

```bash
# Windows
cd android
./gradlew assembleRelease
```

构建完成后 APK 位置：
```
android/app/build/outputs/apk/release/app-release.apk
```

### 4.3 构建 Debug APK

```bash
cd android
./gradlew assembleDebug
```

Debug APK 位置：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.4 构建 AAB（Google Play 格式）

```bash
cd android
./gradlew bundleRelease
```

AAB 位置：
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 五、APK 安装说明

### 直接安装到手机

1. 将 `app-release.apk` 通过 USB 或微信/QQ 传到手机上
2. 在手机上开启 **允许安装未知来源应用**
3. 点击 APK 文件即可安装

### ADB 安装（通过 USB 连接电脑）

```bash
# 连接手机并确认 adb devices 能看到设备
adb devices

# 安装 APK
adb install android/app/build/outputs/apk/release/app-release.apk

# 如果已安装过旧版本，使用 -r 覆盖安装
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## 六、常见问题

### Q: Gradle 下载慢或超时

手动下载 Gradle 并配置本地路径，或将 `gradle-wrapper.properties` 中的 URL 改为国内镜像：

```
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.10.2-bin.zip
```

### Q: SDK 版本不匹配

检查 `android/build.gradle` 中的版本号是否与本地安装的 SDK 匹配：

```groovy
buildToolsVersion = "36.0.0"     // 对应本地 SDK build-tools 版本
compileSdkVersion = 36          // 对应本地 platforms 版本
```

可以通过 SDK Manager 安装缺失版本。

### Q: 构建报错 `Could not find`

可能是网络问题导致依赖下载失败，尝试：

```bash
# 清理缓存后重试
cd android
./gradlew clean
./gradlew assembleRelease --refresh-dependencies
```

### Q: 真机调试连不上

1. 开启手机 **开发者选项** 和 **USB 调试**
2. 执行 `adb devices` 确认设备已识别
3. 如果识别不到，尝试重新插拔或更换 USB 线

---

## 七、项目结构

```
sports-app/
├── App.tsx                    # 应用入口
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx     # 首页
│   │   ├── NewsScreen.tsx     # 资讯页
│   │   ├── ScoreScreen.tsx    # 比分页
│   │   └── ProfileScreen.tsx  # 我的页
│   ├── navigation/
│   │   └── AppNavigator.tsx   # 底部 Tab 导航
│   └── theme/
│       └── index.ts           # 科技风主题配置
├── android/                   # Android 原生项目
├── ios/                       # iOS 项目
├── package.json
└── README.md
```

---

## 八、打包速查（Windows 一键构建）

创建 `build-release.bat` 放在项目根目录：

```bat
@echo off
echo ===== Sports App Release Build =====
echo [1/3] 设置 Android SDK...
echo sdk.dir=D\:\\install\\andorid Studio\\sdk > android\local.properties

echo [2/3] 安装依赖...
call npm install

echo [3/3] 构建 APK...
cd android
call gradlew assembleRelease

echo ===== Build Complete! =====
echo APK: android\app\build\outputs\apk\release\app-release.apk
pause
```

---

*文档版本：v1.0 | 最后更新：2025年*
