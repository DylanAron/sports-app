# 推送通知 & 客服聊天 架构文档

> 最后更新: 2026-06-16 | 版本: 1.0.4

---

## 概述

客服聊天系统采用**双 WebSocket 端点**架构：

- **聊天 WS** `/ws/user/{userId}` — 完整聊天逻辑（分配客服、问候语、双向消息）
- **推送 WS** `/ws/push/{userId}` — 仅接收通知（不触发分配/问候语）

两条 WS 通过 `RedisWebSocketManager` 注册到**同一个** `localUserChannels[userId]` 集合，客服消息同时投递到两条通道。前端通过 `ChatUnreadContext`（React Context）管理全局未读状态，配合 `FloatingNotification`（浮动图标）+ Tab Badge + 振动实现多维度通知。

---

## 一、后端架构

### 1.1 WebSocket 端点一览

| 端点 | 用途 | 分配客服 | 问候语 | 允许发消息 |
|------|------|:---:|:---:|:---:|
| `/ws/user/{userId}` | App 聊天页 | ✅ | ✅ | ✅ |
| `/ws/agent/{agentId}` | 客服后台 | ✅ | — | ✅ |
| `/ws/push/{userId}` | App 推送通知 | ❌ | ❌ | ❌（只收不发）|

### 1.2 关键文件

```
backend/src/main/java/com/customer/
├── constant/
│   ├── ApiConst.java              # WS 路径前缀、Redis Key、TTL 常量
│   └── WsMsgType.java             # WS 消息类型常量
├── websocket/
│   ├── NettyWebSocketServer.java  # Netty 服务器（端口 9090）
│   └── WebSocketHandler.java      # 握手处理 + 消息路由（★核心）
├── service/
│   ├── RedisWebSocketManager.java # WS 通道注册 & 跨实例消息投递
│   ├── RedisAssignmentService.java# 客服分配（Redis 存储）
│   ├── MessageService.java        # 消息 CRUD + 未读查询 + 已读标记
│   └── RedisPubSubListener.java   # Redis Pub/Sub 跨实例监听
├── controller/
│   └── MessageController.java     # REST API（含未读查询/标记接口）
├── entity/
│   └── Message.java               # cs_message 表实体
└── repository/
    └── MessageMapper.java         # MyBatis-Plus Mapper（含未读查询 SQL）
```

### 1.3 推送端点握手流程 (`/ws/push/{userId}`)

```
App 启动/回到前台 → WS 建立连接
  │
  ├─ 1. 解析 URI 提取 userId
  │
  ├─ 2. 从 Redis key "user:lastread:{userId}" 读取 afterId（Bug 8 修复）
  │      如果 Redis 中无值，afterId 默认为 0
  │
  ├─ 3. wsManager.registerUser(userId, channel)
  │      → 注册到 localUserChannels[userId] 集合
  │      → ★ 此后所有 publishAgentMessage() 都会投递到此通道
  │
  ├─ 4. assignmentService.markUserOnline(userId)
  │      → 标记用户在线（Redis TTL 2 分钟）
  │
  └─ 5. messageService.getUnreadInfo(userId, afterId)
         │
         ├─ countAgentMessagesAfter(userId, afterId)
         │   → SELECT COUNT(*) FROM cs_message
         │      WHERE user_id=? AND direction='agent' AND id > ?
         │
         ├─ findLatestAgentMessage(userId)
         │   → SELECT m.agent_id AS agentId, m.created_at AS createdAt
         │      FROM cs_message m
         │      WHERE m.user_id=? AND m.direction='agent'
         │      ORDER BY m.id DESC LIMIT 1
         │
         └─ 发送 unread_info 消息：
            {"type":"unread_info","count":3,"afterId":1001,"latestAgentId":5,"latestAgentName":"客服小明"}
```

**★ 不会发生的事**：
- 不调用 `assignAgent()` — 不触发客服分配
- 不发送 `WELCOME_MESSAGE` — 不发送欢迎语
- 不调用 `sendAssignedGreeting()` — 不发送"很高兴为您服务"
- 不调用 `touchUserLastVisit()` — 不影响最后访问时间

### 1.4 客服消息如何同时到达两条通道

```
客服后台 → ws.send({type:"AGENT_MESSAGE", userId:"u_abc", content:"你好"})
  │
  └─ WebSocketHandler.handleAgentMessage()
       │
       ├─ 验证分配关系（agent ↔ userId）
       ├─ messageService.saveMessage(...)  → 存入 cs_message 表
       └─ wsManager.publishAgentMessage(userId, json)
            │
            ├─ 遍历 localUserChannels[userId] 的所有通道
            │   ├─ 聊天 WS 通道 ✅ → 投递（chatService 收到渲染到屏幕）
            │   └─ 推送 WS 通道 ✅ → 投递（ChatUnreadContext 判断是否增量计数）
            │
            └─ 如果目标用户不在本实例 → Redis PUBLISH channel:agent_msg
                 → 其他实例的 RedisPubSubListener.deliverToLocalUser() 接管
```

**关键设计**：聊天 WS 和推送 WS 都调用 `wsManager.registerUser()` 注册到**同一个通道集合** `localUserChannels[userId]`（`ConcurrentHashMap<String, Set<Channel>>`）。`sendToAllUserChannels()` 遍历所有通道投递，两条通道都能收到。

### 1.5 完整消息 ID 链

为了增量未读计数，每个 agent 方向消息都携带数据库主键 `id`：

| 消息来源 | 携带 id | 代码位置 |
|---------|:---:|------|
| 客服手动发送 | ✅ `msg.getId()` | `handleAgentMessage()` line 261 |
| 关键词自动回复 | ✅ `msg.getId()` | `sendKeywordAutoReply()` line 357 |
| 分配欢迎语 | ❌ 无 ID | `sendAssignedGreeting()` — 仅通过聊天 WS 直接推送 |

### 1.6 REST API

#### `GET /api/message/unread-count/{userId}?afterId=0`

无需认证。前端启动/重连时同步未读数。

**响应示例**：
```json
{
  "count": 3,
  "afterId": 950,
  "latestAgentId": 5,
  "latestAgentName": "客服小明"
}
```

#### `POST /api/message/mark-user-read/{userId}`

无需认证。前端进入聊天页后标记已读位置。

**请求体**：`{"lastReadMsgId": 1002}`

**实现**：`MessageService.markUserRead()` → 写入 Redis `user:lastread:{userId}`，TTL 7 天。不检查新旧值顺序（后端接口允许多端并发调用，以最新值为准）。

### 1.7 Redis 存储一览

| Key | Value | TTL | 用途 |
|-----|-------|-----|------|
| `assignment:user:{userId}` | agentId | 1 day | 客服分配关系 |
| `assignment:agent:{agentId}` | Set\<userId\> | 1 day | 客服服务的用户集合 |
| `user:online:{userId}` | "1" | 2 min | 用户在线心跳 |
| `agent:online:{agentId}` | "1" | 2 min | 客服在线心跳 |
| `user:lastread:{userId}` | msgId | 7 days | 用户最后已读消息 ID |
| `user:last_visit:{userId}` | timestamp | 5 min | 最后访问去重 |

### 1.8 数据库查询

```sql
-- 统计 afterId 之后的客服消息数（增量未读）
SELECT COUNT(*) FROM cs_message
WHERE user_id = #{userId}
  AND direction = 'agent'
  AND id > #{afterId}

-- 查询最近发送消息的客服
SELECT m.agent_id AS agentId, m.created_at AS createdAt
FROM cs_message m
WHERE m.user_id = #{userId}
  AND m.direction = 'agent'
ORDER BY m.id DESC
LIMIT 1
```

---

## 二、前端架构

### 2.1 核心数据流

```
App.tsx
  └─ <ChatUnreadProvider>             ← 全局 Context（推送 WS + 未读状态）
       ├─ 挂载时
       │   ├─ loadUnreadState()       ← AsyncStorage 恢复 lastReadMsgId
       │   ├─ fetchUnreadInfo()       ← REST 同步（仅成功时覆盖，Bug 11）
       │   └─ connectPushWs()         ← 连接 /ws/push/{userId}
       │
       ├─ 收到推送 agent_message
       │   ├─ isChatFocusedRef? → skip（Bug 10：用 ref 避免依赖链重连）
       │   └─ 否则 → incrementUnread() → badge + 振动 + 浮动图标
       │
       ├─ App 切到后台 → 断开推送 WS
       └─ App 回到前台 → 重连推送 WS + REST 同步

<NavigationContainer>
  └─ <Stack.Navigator>
       ├─ MainTabs
       │   └─ <Tab.Navigator>
       │        ├─ Home / Analysis / Score
       │        ├─ Profile (tabBarBadge ← unreadCount)
       │        └─ </Tab.Navigator>
       │   └─ <FloatingNotification />    ← 浮动图标（绝对定位，读 Context）
       │
       └─ CustomerService (Stack Screen)
            └─ 聊天页
                 ├─ 进入: fetchHistory → markLastRead → resetUnread → 连接聊天 WS
                 ├─ WS onOpen → setChatFocused(true)（Bug 12）
                 ├─ WS onMessage → 渲染消息 + markLastRead + markUserRead
                 ├─ 退出: setChatFocused(false)（Bug 13：cleanup 中关闭）
                 └─ 筛选横幅: 只看最近客服 | 查看全部
```

### 2.2 关键文件

```
sports-app/
├── App.tsx                                  # 包裹 ChatUnreadProvider
├── src/
│   ├── contexts/
│   │   └── ChatUnreadContext.tsx            # ★ 核心 Context（推送 WS + 未读管理）
│   ├── services/
│   │   ├── chatService.ts                  # WS 连接 + REST API（fetchUnreadInfo/markUserRead）
│   │   └── unreadStorage.ts               # AsyncStorage 持久化
│   ├── components/
│   │   └── FloatingNotification.tsx        # 浮动邮件图标 + 脉冲动画
│   ├── navigation/
│   │   └── AppNavigator.tsx                # Tab badge + 渲染浮动图标
│   └── screens/
│       └── CustomerServiceScreen.tsx       # 聊天页（filter 支持 + 已读跟踪）
```

### 2.3 ChatUnreadContext（核心状态管理）

#### State

| 字段 | 类型 | 存储位置 | 说明 |
|------|------|---------|------|
| `unreadCount` | number | state + ref | 当前未读消息数量 |
| `latestAgentId` | number\|null | state + ref | 最近发消息的客服 ID |
| `latestAgentName` | string\|null | state + ref | 最近发消息的客服昵称 |
| `lastReadMsgId` | number | ref（仅 ref） | 用户看到的最大消息 ID |
| `isChatFocused` | boolean | ref（仅 ref） | 聊天页是否在前台 |

**设计决策**：
- `unreadCount` / `latestAgentId` / `latestAgentName` 同时存 state（触发 UI 重渲染）和 ref（回调中读到最新值）
- `lastReadMsgId` / `isChatFocused` 只用 ref —— 不触发渲染，避免依赖链导致 WS 重连（Bug 10）

#### Methods

| 方法 | 触发时机 | 行为 |
|------|---------|------|
| `incrementUnread(agentId, agentName?)` | 推送 WS 收到 agent_message 且 `!isChatFocusedRef` | count+1, 振动, 持久化 lastReadMsgId |
| `resetUnread()` | 进入聊天页 | count 归零, 持久化 |
| `markLastRead(msgId)` | 聊天页加载/收到消息 | 更新 lastReadIdRef（仅当更大）, 持久化 |
| `setChatFocused(bool)` | 聊天页 onOpen(true) / cleanup(false) | 设 isChatFocusedRef |

#### Push WS 生命周期

```
App 首次挂载
  └─ connectPushWs()                          ← connectingRef 防并发（Bug 4）
       ├─ 关闭旧连接（如有）
       ├─ getUserId() → "u_abc123"
       ├─ loadUnreadState() → { lastReadMsgId: 1001 }
       ├─ fetchUnreadInfo("u_abc123", 1001)    ← REST 同步
       │   ├─ 成功 → updateUnread(info.count, ...)  ← 权威覆盖
       │   └─ 失败 → null → 保留已有未读数（Bug 11）
       └─ createPushWebSocketConnection(userId, handlers)
            └─ new WebSocket("ws://host:9090/ws/push/u_abc123")
                 ├─ onOpen → console.log
                 ├─ onMessage:
                 │   ├─ agent_message → incrementUnread(agentId)
                 │   └─ unread_info → 检查 count !== unreadRef.current（Bug 7）
                 └─ onClose → 3s 自动重连

App 切到后台
  └─ pushWsRef.close() → 断开

App 回到前台
  └─ connectPushWs() → 重连 + REST 同步

Provider 卸载
  └─ pushWsRef.close() → 断开
```

### 2.4 FloatingNotification（浮动邮件图标）

**位置**：`position: absolute, top: 52, right: 16, zIndex: 9999`

**可见性**：`unreadCount > 0` 时渲染，=== 0 时返回 null

**动画**（`useNativeDriver: true`，不阻塞 JS 线程）：
- 红色脉冲圆环：`Animated.loop` 缩放 1→1.35→1，透明度 0.4→0
- 图标主体回弹：缩放 1→1.15→1
- 仅在 `unreadCount > 0` 时启动动画，count 归零时停止

**点击行为**：`navigation.navigate('CustomerService', { filterAgentId, filterAgentName })`

**显示时机**：在 `TabNavigator` 同级渲染，进入 CustomerService（Stack Screen）后自动被盖住——正确行为，用户在聊天页不需要通知。

### 2.5 Tab Badge

在 `TabNavigator` 中消费 `useChatUnread()` 获取 `unreadCount`：

```tsx
// Profile tab options:
tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
tabBarBadgeStyle: {
  backgroundColor: '#ef4444',
  fontSize: 10,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
}
```

`unreadCount === 0` 时 `tabBarBadge: undefined` 自动隐藏 badge。

### 2.6 CustomerServiceScreen 改造

#### 路由参数
```typescript
route?.params?: {
  filterAgentId?: number;     // 要筛选的客服 ID
  filterAgentName?: string;   // 要筛选的客服昵称
}
```

#### 进入聊天页时序（Bug 12 修复后）

```
CustomerServiceScreen 挂载
  │
  ├─ useEffect[cleanup] → 仅注册 cleanup：return () => setChatFocused(false)
  │     ★ 此时 isChatFocusedRef 仍为 false → 如果有 push 消息，正常计数
  │
  └─ useEffect[init] async:
       ├─ getUserId()
       ├─ fetchHistory(uid, filterAgentId)
       ├─ markLastRead(lastId) + markUserRead(uid, lastId) ← 通知后端
       ├─ setMessagesSync(msgs)
       ├─ resetUnread() ← 清零 badge / 图标
       ├─ createWebSocketConnection(uid, {
       │     onOpen: () => setChatFocused(true)  ← ★ WS 连通后才屏蔽 push
       │     onMessage: handler
       │  })
       └─ wsRef.current = ws
```

#### 退出聊天页

```
cleanup 执行:
  ├─ cancelled = true          ← 阻止未完成的 init 写状态
  ├─ setChatFocused(false)     ← ★ Bug 13：立即恢复 push 计数
  ├─ wsRef.current?.close()    ← 关闭聊天 WS
  └─ wsRef.current = null
```

#### 筛选横幅

- 显示 "查看与客服 {昵称} 的对话" + "查看全部" 按钮
- 点击"查看全部" → `setFilterAgentId(undefined)` + `setFilterAgentName(undefined)` → `useEffect` 自动重新加载全部历史

#### 在聊天页收到消息

```typescript
onMessage: (msg) => {
  if (msg.type === 'agent_message') {
    setMessagesSync((prev) => [{...msg}, ...prev]);  // 渲染到聊天列表
    if (msg.id) {
      markLastRead(msg.id);          // 更新 Context ref
      markUserRead(uid, msg.id);     // POST 到后端 → Redis
    }
  }
}
```

---

## 三、完整消息流转示例

### 场景 A：客服给浏览首页的用户发消息

```
        后端                          前端
         │                            │
客服后台 │  首页（前台）     推送WS    AsyncStorage     Context/UI
────────┼──────────────────────────────────────────────────
        │                            │
客服发送"您│                            │
好，有什 │                            │
么可以帮 │                            │
您的？"  │                            │
   │    │                            │
   ▼    │                            │
handleAgent│                          │
Message() │                           │
   │    │                            │
   ├─ saveMessage() → DB id=1002     │
   │    │                            │
   └─ publishAgentMessage(userId,json)│
        │                            │
        ├─ 聊天WS通道 → 用户不在聊天页│→ 无连接
        │                            │
        └─ 推送WS通道 ───────────────► 收到 agent_message
                                     │    │
                                     │    ├─ isChatFocusedRef? → false
                                     │    ├─ unreadCount: 0→1
                                     │    ├─ Vibration.vibrate(100)
                                     │    ├─ persist() → saveUnreadState()
                                     │    ├─ setUnreadCount(1) → badge "1"
                                     │    └─ FloatingNotification 显示 + 脉冲
                                     │
用户看到浮动图标，点击                 │
──────────────────────────────────    │
                                     │
navigate('CustomerService',          │
  {filterAgentId:5, agentName:'客服1'})│
                                     │
CustomerServiceScreen 挂载            │
├─ cleanup: return () => setChatFocused(false)
├─ fetchHistory(uid, "5", {size:50})│  ← 只加载客服1的历史
├─ markLastRead(1002)                │  → lastReadIdRef=1002, persist
├─ markUserRead(uid, 1002)           │  → POST → Redis user:lastread:uid=1002
├─ resetUnread()                     │  → count=0, badge消失, 图标隐藏
├─ connect chat WS                   │
└─ onOpen → setChatFocused(true)    │  ← push 消息不再计数
                                     │
用户看到筛选横幅                       │
"查看与客服 客服1 的对话" [查看全部]     │
用户点击 [查看全部]                    │
├─ setFilterAgentId(undefined)        │
└─ useEffect 重新触发                   │
    ├─ cleanup: setChatFocused(false) │  ← Bug 13：短暂恢复 push 计数
    ├─ fetchHistory(uid, undefined)   │  ← 加载全部客服
    ├─ markLastRead / resetUnread     │
    └─ onOpen → setChatFocused(true) │
```

### 场景 B：用户在聊天页内，客服发消息

```
        后端                          前端
         │                            │
客服发送消息│   聊天页（前台）   推送WS     Context
────────┼──────────────────────────────────────
   │    │                            │
publishAgentMessage(userId, json)     │
   │    │                            │
   ├─ 聊天WS通道 ──────────────────► onMessage 收到
   │    │                            ├─ setMessagesSync → 渲染气泡
   │    │                            ├─ markLastRead(msg.id) → 更新 ref
   │    │                            └─ markUserRead(uid, msg.id) → Redis
   │    │
   └─ 推送WS通道 ──────────────────► onMessage 收到
        │                            ├─ incrementUnread()
        │                            └─ isChatFocusedRef? → true → return（不计数）
```

### 场景 C：用户杀死 App 后重新打开（持久化恢复）

```
上次已读到 msgId=1002
App 被杀死
─────────────────────────────────────
App 重新启动
ChatUnreadProvider 挂载
├─ connectPushWs()
│   ├─ loadUnreadState() → { lastReadMsgId: 1002 }
│   ├─ fetchUnreadInfo("u_abc", 1002)
│   │   → SELECT COUNT(*) WHERE id > 1002 → count=2
│   │   → SELECT latest agent → agentId=5, name="客服小明"
│   │   → 返回 { count: 2, latestAgentId: 5, latestAgentName: "客服小明" }
│   ├─ updateUnread(2, 5, "客服小明")
│   │   → badge "2", 浮动图标 "2" + 脉冲, 振动
│   └─ connectPushWs → 连推送 WS
│       → 后端从 Redis user:lastread:u_abc 读到 afterId=1002
│       → 发送 unread_info({count: 2, ...})
│       → 前端检查 count(2) !== unreadRef(2)? → 相同，跳过（不重复）
```

---

## 四、已修复 Bug 清单

| # | Bug | 根因 | 修复 |
|---|-----|------|------|
| **#2** | REST 同步累积未读数 | `updateUnread(unreadRef.current + info.count)` 累加 | 改为 `updateUnread(info.count, ...)` 直接覆盖 |
| **#3** | Push WS URL 携带过期 afterId | 前端 URL `?afterId=N` 在用户阅读后过期 | 后端推送到 Redis 读取 afterId，URL 不再带参数 |
| **#4** | `connectPushWs()` 并发调用 | 无并发保护 | 添加 `connectingRef` boolean 守卫 |
| **#6** | `agent_message` 无 `id` 字段 | `handleAgentMessage` / `sendKeywordAutoReply` 未包含 | 添加 `response.put("id", msg.getId())` |
| **#7** | `unread_info` 被错误跳过 | 条件 `count > 0 && unreadRef.current === 0` 过于严格 | 改为 `count !== unreadRef.current` |
| **#8** | Push WS 返回全部历史未读 | afterId=0 从第 1 条起算 | 推送到 Redis `user:lastread:{userId}` 读取 afterId |
| **#10** | 聊天页开关导致 push WS 重连 | `isChatFocused` 是 state → 依赖链触发 connectPushWs 重建 | 改为 `useRef`，不参与依赖链 |
| **#11** | REST 失败清零未读数 | `fetchUnreadInfo` 失败返回 `{count:0}` | 失败返回 `null`，仅在成功时覆盖 |
| **#12** | 聊天页打开后间隙丢消息 | `setChatFocused(true)` 在组件挂载时立即执行，但聊天 WS 尚未建立 | 移到聊天 WS `onOpen` 回调中 |
| **#13** | 筛选切换时丢消息 | cleanup 没调 `setChatFocused(false)`，切换期间 isChatFocusedRef 仍为 true | cleanup 加 `setChatFocused(false)` |

---

## 五、不变动部分（聊天核心逻辑）

以下逻辑**本次完全未修改**，保持原样：

| 逻辑 | 位置 | 说明 |
|------|------|------|
| 客服分配 `assignAgent()` | `RedisAssignmentService` | Redis 查存，TTL 1 天 |
| 用户消息路由 `handleUserMessage()` | `WebSocketHandler` | 分配→存 DB→转发客服 |
| 客服消息路由 `handleAgentMessage()` | `WebSocketHandler` | 验证→存 DB→转发用户（增加了 `id` 字段） |
| 关键词自动回复 | `WebSocketHandler.sendKeywordAutoReply()` | 匹配关键词→自动回复（增加了 `id` 字段） |
| 待分配调度 | `PendingAssignmentScheduler` | 每 5 分钟分配离线消息 |
| 客服在线/离线状态 | `AgentService.setOnline()` | Redis 心跳 TTL 2 分钟 |
| 聊天页 WS 连接 | `CustomerServiceScreen` | `/ws/user/{userId}` — 握手逻辑完全不变 |
| 消息历史加载 | `fetchHistory()` → `GET /api/message/history/` | 支持分页 + 按 agentId 过滤 |
| 文件上传 | `uploadFile()` → `POST /api/message/upload` | 图片限制 10MB |

---

## 六、配置地址

### 端口

| 服务 | 端口 |
|------|------|
| HTTP API（Tomcat） | 8089 |
| WebSocket（Netty） | 9090 |

### 环境地址

| 环境 | CS REST API | WebSocket |
|------|-------------|-----------|
| 开发 | `http://192.168.2.82:8089` | `ws://192.168.2.82:9090/ws` |
| 生产 | `https://cs.6hlot.com` | `wss://cs.6hlot.com/ws` |

配置文件：`sports-app/src/config/env.ts`

---

## 七、变更集

### 后端（customer-service-java）

| 文件 | 操作 | 说明 |
|------|:---:|------|
| `constant/ApiConst.java` | 改 | 新增 `WS_PUSH_PREFIX` |
| `repository/MessageMapper.java` | 改 | 新增 `countAgentMessagesAfter`、`findLatestAgentMessage` |
| `resources/mapper/MessageMapper.xml` | 改 | 新增 2 条 SQL |
| `service/MessageService.java` | 改 | 注入 `AgentMapper`，新增 `getUnreadInfo()`、`markUserRead()` |
| `service/RedisAssignmentService.java` | 改 | 暴露 `getRedisTemplate()` |
| `controller/MessageController.java` | 改 | 新增 `GET /unread-count/{userId}`、`POST /mark-user-read/{userId}` |
| `websocket/WebSocketHandler.java` | 改 | 新增 `/ws/push/` 握手分支；agent 消息新增加 `id` 字段 |

### 前端（sports-app）

| 文件 | 操作 | 说明 |
|------|:---:|------|
| `App.tsx` | 改 | 包裹 `<ChatUnreadProvider>` |
| `src/contexts/ChatUnreadContext.tsx` | **新增** | 推送 WS 连接、未读计数、振动、持久化、前后台管理 |
| `src/services/chatService.ts` | 改 | 新增 `createPushWebSocketConnection`、`fetchUnreadInfo`、`markUserRead`；导出 `WsMessage` |
| `src/services/unreadStorage.ts` | **新增** | AsyncStorage 读写 `lastReadMsgId` |
| `src/components/FloatingNotification.tsx` | **新增** | 浮动邮件图标 + 脉冲动画 |
| `src/navigation/AppNavigator.tsx` | 改 | Profile tab badge + 渲染 FloatingNotification |
| `src/screens/CustomerServiceScreen.tsx` | 改 | 接收 filter 参数、筛选横幅、进入清零未读、onOpen 设置焦点 |
