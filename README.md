# WebDrop - P2P 加密檔案傳輸

WebDrop 是一個開源的 P2P 跨平台檔案傳輸工具，支援多種連接方式，所有檔案傳輸都經過端對端加密保護。

## 功能特色

### 連接方式
- **QR 碼掃描**：使用標準 QR Code 函式庫快速建立連接，無需手動輸入
- **連接代碼**：輸入 12 位連接代碼即可連接（支援帶 dash 或不帶 dash 的格式）
- **手動信令**：無伺服器也能建立真正的 P2P WebRTC 連接（手動複製貼上連接資料）
- **藍牙偵測**：透過藍牙自動搜尋附近裝置（需支援 Web Bluetooth API 的瀏覽器）
- **伺服器連接**：連接自架信令伺服器，自動顯示所有線上裝置列表

### 安全性
- **可選端對端加密**：端對端加密預設關閉，可手動開啟
- **手動金鑰交換**：透過任何通訊軟體（LINE、Email、Messenger 等）分享金鑰
- **ECDH 金鑰協商**：使用橢圓曲線 Diffie-Hellman 金鑰交換協議
- **AES-256 加密**：使用 AES-GCM 或 ChaCha20-Poly1305 加密演算法
- **連接密碼保護**：可設定密碼來保護連接
- **高強度密碼產生器**：內建隨機高強度密碼產生功能
- **Cookie 加密儲存**：密碼加密儲存在瀏覽器中

### 音效系統
提供多種互動音效：
- 開啟音效
- 上傳音效
- 接收音效
- 同意連接音效
- 選擇音效
- 權限請求音效
- 傳送完成音效
- 偵測成功音效

可透過設定頁面開關音效及調整音量大小。

### 視覺效果
- 重新設計的緊湊型頂部欄：整合專案名稱、裝置名稱輸入框和設定按鈕於同一行
- 自訂游標帶有藍色光暈效果
- 互動元素懸停時放大顯示
- 藍色邊框和光暈效果
- 檔案接收動畫
- 流暢的過場動畫

### 用戶命名
- 支援自訂用戶名稱
- 支援中文、英文大小寫、數字、特殊符號
- 初次進入時自動隨機命名
- 名稱儲存在 Cookies 中
- 點擊骰子按鈕可產生新的隨機名稱（僅英文大小寫或英文大小寫加數字）

### 裝置資訊顯示
在傳送模式中可查看已連線裝置的詳細資訊：
- **裝置系統**：顯示對方裝置的作業系統（Android / iOS / Windows / macOS / Linux）
- **裝置類型**：識別對方裝置類型（手機 / 平板 / 電腦）
- **瀏覽器資訊**：顯示對方使用的瀏覽器名稱，無法識別時顯示「未知瀏覽器」

## 使用說明

### 快速開始
1. 在瀏覽器中開啟 WebDrop 網頁
2. 在「接收模式」選擇連接方式並分享給對方
3. 對方透過 QR 碼、連接代碼或手動信令發送連接請求
4. 雙方同意後即建立連接
5. 切換到「傳送模式」選擇檔案並傳送

### 開啟端對端加密（手動金鑰交換）

如果您需要端對端加密保護但沒有信令伺服器，可以透過手動金鑰交換方式實現：

1. **雙方開啟端對端加密**
   - 點擊右上角「設定」按鈕
   - 開啟「開啟端對端加密」開關

2. **分享您的金鑰**
   - 點擊「複製」按鈕複製您的公鑰
   - 透過任何通訊軟體（LINE、Email、Messenger、WhatsApp 等）將金鑰傳送給對方

3. **輸入對方的金鑰**
   - 貼上對方分享的金鑰到「輸入對方金鑰」框中
   - 點擊「設定對方金鑰」

4. **開始加密傳輸**
   - 設定完成後，與該裝置的檔案傳輸將會自動加密

### 手動信令連接（真正的 P2P 連接）

即使沒有伺服器，您也可以透過「手動信令」功能建立真正的 WebRTC P2P 連接：

**作為發起者（建立連接）**：
1. 在「接收模式」選擇「手動信令」
2. 點擊「建立連接」標籤
3. 點擊「產生連接資料」
4. 複製產生的連接資料
5. 透過 LINE、Email 或其他通訊軟體傳送給對方
6. 等待對方回應

**作為接收者（加入連接）**：
1. 在「接收模式」選擇「手動信令」
2. 點擊「加入連接」標籤
3. 貼上對方分享的連接資料
4. 點擊「連接」
5. 連接建立成功！

**優點**：
- 不需要伺服器
- 真正的點對點連接
- 支援大檔案傳輸
- 低延遲

**限制**：
- 需要手動交換連接資料
- 雙方需要在線才能建立連接

### 伺服器連接（自架伺服器專用）

如果您自行架設了信令伺服器，可以使用「伺服器連接」功能：

**連接到伺服器**：
1. 在「接收模式」選擇「伺服器連接」
2. 輸入伺服器地址（如：`ws://192.168.1.100:3000` 或 `wss://your-server.com`）
3. 點擊「連接」
4. 連接成功後會自動顯示所有已連接該伺服器的裝置列表

**自動偵測**：
- 系統會自動記憶您輸入的伺服器地址
- 下次開啟頁面時可點擊「自動偵測」快速連接
- 也可將常用伺服器儲存為預設伺服器

**選擇裝置並連接**：
1. 連接成功後，伺服器上的所有線上裝置會顯示在列表中
2. 點擊裝置旁邊的「連接」按鈕發送連接請求
3. 對方同意後即建立連接

**優點**：
- 自動顯示所有線上裝置
- 無需手動交換連接資料
- 適合頻繁使用的場景
- 支援跨網路連接（如果伺服器有公開外網）

### 支援平台
- Chrome / Edge / Firefox / Safari
- 桌面電腦（Windows / macOS / Linux）
- 行動裝置（Android / iOS）

## 瀏覽器支援

### QR 碼、連接代碼、手動信令
所有現代瀏覽器都支援這些基本功能。

| 瀏覽器 | QR 碼 | 連接代碼 | 手動信令 | 伺服器連接 |
|--------|-------|----------|---------|-----------|
| Chrome | ✓ | ✓ | ✓ | ✓ |
| Edge | ✓ | ✓ | ✓ | ✓ |
| Firefox | ✓ | ✓ | ✓ | ✓ |
| Safari | ✓ | ✓ | ✓ | ✓ |
| Brave | ✓ | ✓ | ✓ | ✓ |
| Opera | ✓ | ✓ | ✓ | ✓ |
| Samsung Internet | ✓ | ✓ | ✓ | ✓ |
| Via | ✓ | ✓ | ✓ | ✓ |
| DuckDuckGo | ✓ | ✓ | ✓ | ✓ |

### 藍牙支援

**重要說明**：Web Bluetooth API 的支援情況因瀏覽器和作業系統而異。

| 瀏覽器 | 版本需求 | 桌面端 | 行動端 | 備註 |
|--------|---------|--------|--------|------|
| **Chrome** | 56+ | ✅ 支援 | ✅ 支援（Android） | 完全支援 |
| **Edge** | 79+ | ✅ 支援 | ✅ 支援（Android） | 基於 Chromium |
| **Opera** | 43+ | ✅ 支援 | ❌ 不支援 | 僅限桌面版 |
| **Samsung Internet** | 任意版本 | ❌ 不支援 | ✅ 支援 | 僅限行動端 |
| **Brave** | 任意版本 | ✅ 支援 | ❌ 不支援 | 基於 Chromium |
| **Firefox** | 任意版本 | ❌ 不支援 | ❌ 不支援 | Mozilla 不打算支援 |
| **Safari** | 任意版本 | ❌ 不支援 | ❌ 不支援 | Apple 不打算支援 |
| **iOS 所有瀏覽器** | 任意版本 | - | ❌ 不支援 | iOS WebKit 限制 |

### 藍牙功能說明

**支援藍牙的裝置環境**：
- **桌上型電腦**：需要配備藍牙適配器，使用 Chrome、Edge 或 Opera 瀏覽器
- **筆記型電腦**：大多數內建藍牙，使用 Chrome、Edge 或 Opera 瀏覽器
- **Android 手機/平板**：使用 Chrome 或 Samsung Internet 瀏覽器
- **iOS 裝置**：不支援（Safari 和所有 iOS 瀏覽器均不支援）

**不支援藍牙的情況**：
- 使用 Firefox（所有版本）
- 使用 Safari（所有版本，包括 macOS 和 iOS）
- 使用 iOS 的任何瀏覽器（Chrome、Firefox、Safari 等）
- 桌面版 Opera 行動版
- 桌面版 Samsung Internet

**解決方案**：
如果您的瀏覽器不支援藍牙，請使用其他連接方式：
- QR 碼掃描
- 連接代碼
- 手動信令
- 伺服器連接（如果您有自架伺服器）

### 瀏覽器偵測

WebDrop 會嘗試自動偵測對方使用的瀏覽器。如果瀏覽器無法被識別或不在支援名單中，會顯示「未知瀏覽器」。

**支援的瀏覽器識別**：
- Chrome、Firefox、Edge、Safari、Opera
- Brave、Vivaldi、Samsung Internet
- Via、DuckDuckGo

**顯示為「未知瀏覽器」的情況**：
- 瀏覽器版本過舊
- 使用自訂或冷門瀏覽器
- User-Agent 被修改或偽裝
- 無法從 User-Agent 字串中識別

**注意**：即使顯示「未知瀏覽器」，檔案傳輸功能仍然可以正常運作。

## WebRTC 與伺服器說明

### 什麼是 WebRTC？

WebRTC（Web Real-Time Communication）是一種讓瀏覽器之間可以直接進行點對點（P2P）通訊的技術。

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebRTC 運作流程示意圖                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   【第一階段：需要伺服器】信令交換                                 │
│   ┌─────────┐     HTTP/WebSocket     ┌─────────┐               │
│   │ 瀏覽器 A │ ◄──────────────────► │ 信令伺服器 │               │
│   │ (客戶端)│   SDP + ICE Candidates │  (需要)   │               │
│   └─────────┘                       └─────────┘               │
│         │                                  │                   │
│         └──────── 交換連接資訊 ────────────┘                   │
│                                                                  │
│   【第二階段：直接連線】P2P 資料傳輸                              │
│   ┌─────────┐                           ┌─────────┐           │
│   │ 瀏覽器 A │ ◄──────────────────────► │ 瀏覽器 B │           │
│   │ (客戶端)│      直接連線 (UDP/TCP)    │ (客戶端) │           │
│   └─────────┘                           └─────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GitHub Pages 可以執行 WebRTC 嗎？

**不行。** GitHub Pages 是靜態網頁托管服務，無法運行信令伺服器。

但是！WebDrop 提供兩種替代方案：

| 服務類型 | GitHub Pages | 自架伺服器 |
|---------|--------------|-----------|
| 靜態 HTML/CSS/JS | ✅ 可以 | ✅ 可以 |
| WebRTC 信令伺服器 | ❌ 不行 | ✅ 可以 |
| WebSocket 伺服器 | ❌ 不行 | ✅ 可以 |
| 手動信令（無伺服器） | ✅ 可以 | ✅ 可以 |

### 手動信令 vs 信令伺服器

| 比較項目 | 手動信令（無伺服器） | 信令伺服器 |
|---------|-------------------|-----------|
| 需要伺服器 | ❌ 不需要 | ✅ 需要 |
| 連接建立速度 | 需要手動交換資料 | 自動完成 |
| 使用難度 | 稍複雜（需複製貼上） | 簡單（選擇裝置即可） |
| 穩定性 | 取決於網路環境 | 較穩定 |
| 裝置發現 | 需手動輸入資訊 | 自動顯示線上裝置 |
| 適合場景 | 臨時連接、隱私敏感 | 經常使用 |

WebDrop 兩種方式都支援，您可以根據需求選擇！

## 自架信令伺服器

如果您需要完整的 WebRTC P2P 連接功能，可以自行架設信令伺服器。以下提供兩種方案：

### 方案一：使用 Node.js + Socket.io（推薦）

#### 1. 安裝 Node.js
從 [nodejs.org](https://nodejs.org/) 下載並安裝 Node.js（建議 v16 以上版本）

#### 2. 建立伺服器專案
```bash
mkdir webdrop-signaling
cd webdrop-signaling
npm init -y
npm install express socket.io uuid
```

#### 3. 建立伺服器程式
建立 `server.js` 檔案：
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// 儲存房間資訊
const rooms = new Map();

// 儲存所有已連接的客戶端
const clients = new Map();

// Socket.io 連接處理
io.on('connection', (socket) => {
    console.log('新客戶端連接:', socket.id);

    // 處理客戶端註冊
    socket.on('register', (data) => {
        clients.set(socket.id, {
            id: socket.id,
            peerId: data.peerId,
            name: data.name,
            deviceType: data.deviceType,
            browser: data.browser,
            os: data.os,
            connectedAt: new Date()
        });
        
        // 廣播更新後的客戶端列表
        broadcastPeersList();
    });

    // 建立或加入房間
    socket.on('join-room', (roomId) => {
        const room = rooms.get(roomId) || {
            id: roomId,
            clients: new Map(),
            host: null
        };

        if (!room.host) {
            room.host = socket.id;
        }

        room.clients.set(socket.id, {
            id: socket.id,
            publicKey: null,
            connectedAt: new Date()
        });

        rooms.set(roomId, room);
        socket.join(roomId);

        // 通知客戶端加入成功
        socket.emit('room-joined', {
            roomId,
            isHost: socket.id === room.host
        });

        // 通知房間內其他客戶端
        socket.to(roomId).emit('peer-joined', {
            peerId: socket.id,
            name: clients.get(socket.id)?.name,
            peer: clients.get(socket.id)
        });
    });

    // 交換公鑰
    socket.on('exchange-key', ({ roomId, publicKey }) => {
        const room = rooms.get(roomId);
        if (room && room.clients.has(socket.id)) {
            room.clients.get(socket.id).publicKey = publicKey;
            
            // 廣播公鑰給房間內其他客戶端
            socket.to(roomId).emit('peer-key', {
                peerId: socket.id,
                publicKey
            });
        }
    });

    // WebRTC 信令：SDP 和 ICE Candidates
    socket.on('signal', ({ roomId, target, signal }) => {
        const room = rooms.get(roomId);
        if (room) {
            io.to(target).emit('signal', {
                sender: socket.id,
                signal
            });
        }
    });

    // 處理連接請求（從 WebDrop 客戶端）
    socket.on('connect-request', (data) => {
        const targetSocketId = Array.from(clients.entries())
            .find(([socketId, client]) => client.peerId === data.targetPeerId)?.[0];
        
        if (targetSocketId) {
            io.to(targetSocketId).emit('connection-request', {
                fromPeerId: data.fromPeerId,
                fromName: data.fromName,
                fromDeviceType: data.fromDeviceType,
                fromBrowser: data.fromBrowser,
                fromOS: data.fromOS
            });
        }
    });

    // 處理連接回應
    socket.on('connect-response', (data) => {
        const targetSocketId = Array.from(clients.entries())
            .find(([socketId, client]) => client.peerId === data.fromPeerId)?.[0];
        
        if (targetSocketId) {
            io.to(targetSocketId).emit('connection-response', {
                accepted: data.accepted,
                fromPeerId: data.fromPeerId,
                fromName: data.fromName,
                fromDeviceType: data.fromDeviceType,
                fromBrowser: data.fromBrowser,
                fromOS: data.fromOS
            });
        }
    });

    // 離開房間
    socket.on('leave-room', (roomId) => {
        handleLeaveRoom(socket, roomId);
    });

    // 斷線處理
    socket.on('disconnect', () => {
        console.log('客戶端斷線:', socket.id);
        
        // 從客戶端列表移除
        clients.delete(socket.id);
        
        // 廣播更新後的列表
        broadcastPeersList();
        
        // 處理所有房間的離開
        rooms.forEach((room, roomId) => {
            if (room.clients.has(socket.id)) {
                handleLeaveRoom(socket, roomId);
            }
        });
    });
});

// 廣播客戶端列表給所有連接的客戶端
function broadcastPeersList() {
    const peersList = Array.from(clients.values())
        .filter(client => client.peerId) // 只廣播有 peerId 的客戶端
        .map(client => ({
            peerId: client.peerId,
            name: client.name,
            deviceType: client.deviceType,
            browser: client.browser,
            os: client.os
        }));
    
    io.emit('peers-list', { peers: peersList });
}

function handleLeaveRoom(socket, roomId) {
    const room = rooms.get(roomId);
    if (room) {
        room.clients.delete(socket.id);
        socket.to(roomId).emit('peer-left', {
            peerId: socket.id
        });

        // 如果主持人離開，指定新主持人
        if (socket.id === room.host && room.clients.size > 0) {
            const newHost = room.clients.keys().next().value;
            room.host = newHost;
            io.to(roomId).emit('host-changed', {
                hostId: newHost
            });
        }

        // 如果房間空了，刪除房間
        if (room.clients.size === 0) {
            rooms.delete(roomId);
        }
    }
    socket.leave(roomId);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebDrop 信令伺服器執行中：http://localhost:${PORT}`);
});
```

#### 4. 建立 Web 資料夾
```bash
mkdir public
```

將您的 `index.html` 複製到 `public` 資料夾。

#### 5. 啟動伺服器
```bash
node server.js
```

#### 6. 執行 WebDrop
在瀏覽器中開啟 `http://localhost:3000`

---

### 方案二：使用 Docker 部署

#### 1. 建立 Dockerfile
建立 `Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安裝相依套件
COPY package*.json ./
RUN npm install express socket.io uuid

# 複製應用程式
COPY server.js ./
COPY public/ ./public/

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. 建立 docker-compose.yml
```yaml
version: '3.8'

services:
  webdrop-signaling:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - PORT=3000
```

#### 3. 部署
```bash
docker-compose up -d
```

---

### 方案三：使用現成服務（免費）

如果您不想自架伺服器，可以使用免費的公共信令服務：

#### 1. PeerJS（推薦）
```javascript
// 在 HTML 中添加
<script src="https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js"></script>

// 使用方式
const peer = new Peer();
peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
});
```

#### 2. PubNub
提供免費的 WebRTC 信令服務，適合小型專案。

#### 3. Trystero
免費的去中心化 WebRTC 連接服務。

---

### Nginx 反向代理（可選）

如果您需要 HTTPS 和負載均衡，可以使用 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### SSL/HTTPS 設定

1. 安裝 Certbot：
```bash
sudo apt install certbot python3-certbot-nginx
```

2. 取得 SSL 憑證：
```bash
sudo certbot --nginx -d your-domain.com
```

---

## 技術架構

- **前端**：原生 HTML5 / CSS3 / JavaScript
- **通訊**：WebRTC（需要信令伺服器）/ Web Bluetooth API
- **加密**：Web Crypto API（AES-256-GCM / ChaCha20-Poly1305 / ECDH）
- **無伺服器模式**：使用手動金鑰交換實現端對端加密
- **有伺服器模式**：使用 WebRTC DataChannel 進行 P2P 檔案傳輸

## 注意事項

- 藍牙功能僅在特定瀏覽器中支援（見瀏覽器支援章節）
- 某些瀏覽器可能需要 HTTPS 環境才能使用 WebRTC 和藍牙功能
- 為獲得最佳體驗，建議使用最新版 Chrome 或 Edge 瀏覽器
- 清除瀏覽器 Cookies 可能會導致已儲存的設定和名稱遺失
- 端對端加密預設關閉，需要手動開啟並交換金鑰
- 伺服器連接功能需要自架或使用相容的信令伺服器

## 未來計畫

- 增加更多連接方式
- 優化檔案傳輸效能
- 支援更多檔案類型預覽
- 提供免費公共信令伺服器
- 改善藍牙相容性

## 專案資訊

### 作者
- **作者**：milk120106
- **GitHub**：https://github.com/milk120106/WebDrop
- **聯絡信箱**：ivyhung151201@gmail.com

### 開源授權
本專案採用 MIT License 開源授權。
