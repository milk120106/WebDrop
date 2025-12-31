/**
 * WebDrop Trystero P2P 整合模組
 * 
 * 此模組提供去中心化 P2P 連線功能，使用 Trystero 函式庫
 * 透過公共 BitTorrent 追蹤器、Nostr 中繼站或 MQTT 進行信令
 * 
 * 注意：Trystero 需要從 CDN 載入或透過 npm 安裝
 * 本地版本請參考: https://github.com/dmotz/trystero
 */

// Trystero P2P 命名空間
window.Trystero = window.Trystero || {};

// 載入 Trystero 函式庫
async function loadTrystero() {
    return new Promise((resolve, reject) => {
        // 檢查是否已經載入
        if (window.joinRoom) {
            console.log('✅ Trystero 已載入');
            resolve(true);
            return;
        }
        
        // 建立 script 標籤
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/trystero@0.21.4/dist/trystero-torrent.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ Trystero 載入成功');
            resolve(true);
        };
        
        script.onerror = () => {
            console.error('❌ Trystero 載入失敗');
            // 即使載入失敗也繼續執行，使用降級模式
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

// P2P 連線管理器
class P2PManager {
    constructor() {
        this.room = null;
        this.roomName = 'webdrop-p2p-v1';
        this.config = {
            appId: 'webdrop-serverless',
            password: null
        };
        this.joined = false;
        this.peers = new Map();
        this.listeners = new Map();
    }
    
    // 初始化並加入房間
    async init() {
        try {
            await loadTrystero();
            
            if (!window.joinRoom) {
                console.log('⚠️ Trystero 不可用，使用降級模式');
                return false;
            }
            
            console.log('🔗 正在加入 P2P 網路...');
            
            // 加入房間
            this.room = joinRoom(this.config, this.roomName);
            
            // 設定事件監聽
            this.setupEventListeners();
            
            this.joined = true;
            console.log('✅ 已加入 P2P 網路');
            
            // 廣播上線
            this.broadcastPresence();
            
            return true;
        } catch (error) {
            console.error('❌ P2P 初始化失敗:', error);
            return false;
        }
    }
    
    // 設定事件監聽
    setupEventListeners() {
        // 新對等端加入
        this.room.on('peerJoin', (peerId) => {
            console.log('👋 新對等端加入:', peerId);
            this.emit('peerJoin', peerId);
        });
        
        // 對等端離開
        this.room.on('peerLeave', (peerId) => {
            console.log('👋 對等端離開:', peerId);
            this.peers.delete(peerId);
            this.emit('peerLeave', peerId);
        });
        
        // 收到消息
        this.room.onMessage((data, peerId) => {
            this.handleMessage(data, peerId);
        });
    }
    
    // 處理收到的消息
    handleMessage(data, peerId) {
        switch (data.type) {
            case 'presence':
                this.peers.set(peerId, data);
                this.emit('peerDiscovered', { peerId, info: data });
                break;
                
            case 'connection-request':
                this.emit('connectionRequest', { peerId, info: data });
                break;
                
            case 'connection-response':
                this.emit('connectionResponse', { peerId, info: data });
                break;
                
            case 'file-offer':
                this.emit('fileOffer', { peerId, info: data });
                break;
                
            case 'file-accept':
                this.emit('fileAccept', { peerId, info: data });
                break;
                
            case 'file-reject':
                this.emit('fileReject', { peerId, info: data });
                break;
                
            default:
                this.emit('message', { peerId, data });
        }
    }
    
    // 廣播上線消息
    broadcastPresence() {
        if (!this.room || !this.joined) return;
        
        const presenceAction = this.room.getAction('presence');
        if (presenceAction) {
            presenceAction({
                type: 'presence',
                name: window.state?.peerName || 'WebDrop 用戶',
                deviceType: window.state?.deviceType || '未知',
                browser: window.state?.browser || '未知瀏覽器',
                os: window.state?.os || '未知系統',
                peerId: window.state?.peerId || generateId()
            });
        }
    }
    
    // 發送連線請求
    sendConnectionRequest(peerId) {
        if (!this.room || !this.joined) return false;
        
        const action = this.room.getAction('connection-request');
        if (action) {
            action({
                type: 'connection-request',
                name: window.state?.peerName || 'WebDrop 用戶',
                deviceType: window.state?.deviceType || '未知',
                browser: window.state?.browser || '未知瀏覽器',
                os: window.state?.os || '未知系統',
                peerId: window.state?.peerId || generateId()
            }, peerId);
            return true;
        }
        return false;
    }
    
    // 發送檔案提議
    sendFileOffer(peerId, fileData) {
        if (!this.room || !this.joined) return false;
        
        const action = this.room.getAction('file-offer');
        if (action) {
            action({
                type: 'file-offer',
                fileId: fileData.id,
                fileName: fileData.name,
                fileSize: fileData.size,
                fileType: fileData.type
            }, peerId);
            return true;
        }
        return false;
    }
    
    // 接受檔案傳輸
    sendFileAccept(peerId, fileData) {
        if (!this.room || !this.joined) return false;
        
        const action = this.room.getAction('file-accept');
        if (action) {
            action({
                type: 'file-accept',
                fileId: fileData.id,
                fileName: fileData.name
            }, peerId);
            return true;
        }
        return false;
    }
    
    // 拒絕檔案傳輸
    sendFileReject(peerId, fileData) {
        if (!this.room || !this.joined) return false;
        
        const action = this.room.getAction('file-reject');
        if (action) {
            action({
                type: 'file-reject',
                fileId: fileData.id,
                fileName: fileData.name
            }, peerId);
            return true;
        }
        return false;
    }
    
    // 廣播消息給所有對等端
    broadcast(data) {
        if (!this.room || !this.joined) return;
        
        const actionName = data.type;
        const action = this.room.getAction(actionName);
        if (action) {
            action(data);
        }
    }
    
    // 事件監聽器 API
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件處理錯誤 [${event}]:`, error);
                }
            });
        }
    }
    
    // 取得對等端數量
    getPeerCount() {
        return this.peers.size;
    }
    
    // 取得所有對等端
    getPeers() {
        return Array.from(this.peers.entries()).map(([peerId, info]) => ({
            peerId,
            ...info
        }));
    }
    
    // 離開房間
    leave() {
        if (this.room && this.joined) {
            this.room.leave();
            this.joined = false;
            this.peers.clear();
            console.log('👋 已離開 P2P 網路');
        }
    }
    
    // 取得連線狀態
    getStatus() {
        if (!this.joined) return 'disconnected';
        if (this.peers.size > 0) return 'connected';
        return 'searching';
    }
}

// 生成唯一 ID
function generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    });
}

// 匯出全域物件
window.TrysteroManager = new P2PManager();
window.TrysteroLoader = loadTrystero;
window.generateId = generateId;

// 自動初始化（可選）
// document.addEventListener('DOMContentLoaded', () => {
//     TrysteroManager.init();
// });

console.log('📦 WebDrop Trystero P2P 模組已載入');
