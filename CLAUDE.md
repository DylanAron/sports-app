# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供此仓库的代码指引。

## 构建与运行命令

```bash
# 安装依赖
npm install

# 启动 Metro 开发服务器
npm start
# 或: npx react-native start

# 运行到 Android
npm run android

# 运行到 iOS（需要 CocoaPods）
cd ios && bundle exec pod install && cd .. && npm run ios

# 代码检查
npm run lint

# 运行测试
npm test

# 构建 APK
cd android && ./gradlew assembleRelease    # Release APK
cd android && ./gradlew assembleDebug       # Debug APK
cd android && ./gradlew bundleRelease       # Google Play AAB 格式
```

## 技术栈

- **React Native 0.85.3** (React 19)
- **TypeScript**，使用 `@react-native/typescript-config`
- **导航**: `@react-navigation/native` v7，含 `native-stack` + `bottom-tabs`
- **状态管理**: 组件本地状态，无全局 store
- **加密**: 基于 `crypto-js` 的 AES-256-CBC，用于 API 请求体加密
- **测试**: Jest + `@react-native/jest-preset`
- **代码规范**: ESLint (`@react-native` 配置) + Prettier

## 项目结构

```
App.tsx                          # 根组件: SafeAreaProvider + StatusBar + Navigation
src/
├── navigation/AppNavigator.tsx  # 底部 Tab 导航 (AI/分析/比分/我的) + 堆栈页面
├── screens/
│   ├── HomeScreen.tsx           # AI智能预测: 轮播图 + AI 预测卡片网格
│   ├── AnalysisScreen.tsx       # 赛事分析: 水平卡片轮播，带动画缩放效果
│   ├── NewsScreen.tsx           # 体育资讯: 模拟数据（未对接 API）
│   ├── ScoreScreen.tsx          # 比分: 嵌入 WebView (leisu.com)，自动绕过滑块验证
│   ├── ProfileScreen.tsx        # 我的: 登录、编辑资料、菜单列表、每日励志弹窗
│   ├── corner/                  # AI 预测子页面 (列表、详情、情报)
│   └── profile/LoginScreen.tsx  # 登录/注册弹窗
├── services/                    # API 服务层 (index.ts 统一导出)
│   ├── request.ts              # HTTP 客户端: 自动注入 deviceId、token、AES 加解密
│   ├── activationService.ts    # 应用激活上报
│   ├── bannerService.ts        # 首页轮播图
│   ├── chatService.ts          # 客服聊天 (WebSocket + REST)
│   ├── contentService.ts       # 帮助/关于内容 + AI 每日励志
│   ├── cornerService.ts        # 角球预测 CRUD
│   ├── otherServices.ts        # 进球/半全场/比分/胜负/情报 API
│   ├── tabGuideService.ts      # Tab 引导弹窗配置
│   └── userService.ts          # 登录、注册、用户信息 API
├── config/
│   ├── env.ts                  # 开发/生产环境 API 地址、WS 地址、功能开关
│   └── cryptoConfig.ts         # AES 加密密钥 (开发环境默认与生产相同)
├── device/
│   ├── deviceId.ts             # Android ANDROID_ID / iOS identifierForVendor
│   ├── crypto.ts               # AES-256-CBC 加解密工具函数
│   └── appTrack.ts             # 百度 oCPX SDK 桥接 (初始化、激活上报、事件埋点)
├── components/
│   ├── PrivacyAgreementModal.tsx  # 首次启动隐私协议弹窗
│   ├── TabGuideModal.tsx          # Tab 引导浮层
│   └── CustomerServiceModal.tsx   # 客服聊天弹窗
├── theme/index.ts              # 主题 (蓝白配色)、字体、间距
├── types/global.d.ts           # 全局类型: __AUTH_TOKEN__
└── utils/
    └── request.ts              # HTTP 客户端实现 (从 services/ 再导出)
```

## 架构要点

### API 层
- 所有请求通过 `src/services/request.ts` (`api.get/post/put/delete`)
- 根据 `__DEV__` 自动切换 API 地址：开发环境 `192.168.2.82:8086`，生产 `https://6hlot.com`
- v2 接口请求体使用 AES-256-CBC 加密（密钥在 `cryptoConfig.ts`）
- 自动通过 `X-Device-Id` 请求头发送设备 ID
- 认证令牌存储在 `globalThis.__AUTH_TOKEN__`，通过 `Bearer` 请求头发送
- 401 响应触发 token 过期回调 (`setOnTokenExpired`)，自动退出登录

### 导航结构
- 根导航为 NativeStackNavigator，包含 MainTabs 和堆栈页面（客服、隐私协议、用户协议、帮助、关于）
- MainTabs 为 BottomTabNavigator，4 个标签页：Home (AI)、Analysis (分析)、Score (比分)、Profile (我的)
- HomeScreen 使用 `PageState` 联合类型管理子页面状态（非导航方式），直接内联渲染 CornerList/CornerDetail/AiList/Intelligence

### 关键特性
- **隐私优先**: 用户同意隐私协议前，百度 oCPX SDK 不会被初始化（PrivacyAgreementModal 首次启动时弹出）
- **客服系统**: 基于 WebSocket 的聊天，支持自动重连、文件上传、历史消息拉取
- **比分页面**: 通过 WebView 嵌入 `m.leisu.com/live/`，注入 JS 自动绕过滑块验证码
- **激活上报**: 双路上报（百度归因 + 自有服务器），通过 AsyncStorage 标记防重复

### 版本管理

版本号统一维护在以下 3 个位置，每次升级需同步修改：

| 文件 | 字段 | 当前值 |
|------|------|--------|
| `package.json` | `version` | 1.0.3 |
| `android/app/build.gradle` | `defaultConfig.versionName` | 1.0.3 |
| `ios/SportsApp.xcodeproj/project.pbxproj` | `MARKETING_VERSION` | 1.0.3 |

更新 app 版本时，三处必须同时修改，保持一致。
- 编辑 `src/config/env.ts` — `__DEV__` 自动选择配置，release 构建使用生产配置
- 修改 `src/config/cryptoConfig.ts` 中的 `AES_KEY`（必须与服务端一致）
