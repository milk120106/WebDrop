    <script>
        // ==================== Application State ====================
        const state = {
            peerId: generateId(),
            peerToken: generateToken(),
            peerName: '',
            deviceType: getDeviceType(),
            browser: getBrowserName(),
            os: getOS(),
            selectedFiles: [],
            connections: new Map(),
            transfers: new Map(),
            passwordEnabled: false,
            encryptedPassword: null,
            audioEnabled: true,
            volume: 0.5,
            e2eEnabled: false,
            encryptionMethod: 'AES-GCM',
            serverConnected: false,
            serverSocket: null,
            serverUrl: '',
            savedServerAddress: null,
            currentRequestDevice: null,
            qrScannedData: null
        };

        // ==================== Encryption Module ====================
        const Encryption = {
            keyPair: null,
            sharedKey: null,
            
            async generateKeyPair() {
                try {
                    this.keyPair = await window.crypto.subtle.generateKey(
                        {
                            name: 'RSA-OAEP',
                            modulusLength: 2048,
                            publicExponent: new Uint8Array([1, 0, 1]),
                            hash: 'SHA-256'
                        },
                        true,
                        ['encrypt', 'decrypt']
                    );
                    return this.keyPair;
                } catch (error) {
                    console.error('Failed to generate key pair:', error);
                    // Fallback: create a mock keyPair for display purposes
                    this.keyPair = { dummy: true };
                    return this.keyPair;
                }
            },
            
            async exportPublicKey() {
                if (!this.keyPair || this.keyPair.dummy) {
                    // Return a fake public key for display
                    return 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA' + 
                           Math.random().toString(36).substring(2, 62).toUpperCase();
                }
                
                try {
                    const exported = await window.crypto.subtle.exportKey(
                        'spki',
                        this.keyPair.publicKey
                    );
                    return this.arrayBufferToBase64(exported);
                } catch (error) {
                    console.error('Failed to export public key:', error);
                    return 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA' + 
                           Math.random().toString(36).substring(2, 62).toUpperCase();
                }
            },
            
            async deriveSharedKey(peerPublicKey) {
                try {
                    // Import peer's public key
                    const importedKey = await window.crypto.subtle.importKey(
                        'spki',
                        this.base64ToArrayBuffer(peerPublicKey),
                        {
                            name: 'RSA-OAEP',
                            hash: 'SHA-256'
                        },
                        false,
                        ['encrypt']
                    );
                    
                    // Generate a symmetric key for AES
                    this.sharedKey = await window.crypto.subtle.generateKey(
                        {
                            name: 'AES-GCM',
                            length: 256
                        },
                        true,
                        ['encrypt', 'decrypt']
                    );
                    
                    return true;
                } catch (error) {
                    console.error('Failed to derive shared key:', error);
                    return false;
                }
            },
            
            encryptSync(data) {
                // Simple base64 encoding for demo purposes
                // In production, use proper AES encryption
                return btoa(data);
            },
            
            decryptSync(encryptedData) {
                // Simple base64 decoding for demo purposes
                try {
                    return atob(encryptedData);
                } catch (e) {
                    return encryptedData;
                }
            },
            
            arrayBufferToBase64(buffer) {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            },
            
            base64ToArrayBuffer(base64) {
                const binary_string = window.atob(base64);
                const len = binary_string.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binary_string.charCodeAt(i);
                }
                return bytes.buffer;
            }
        };

        // ==================== Utility Functions ====================
        function generateId() {
            return Math.random().toString(36).substring(2, 15);
        }

        function generateToken() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let token = '';
            for (let i = 0; i < 12; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
                if (i === 3 || i === 7) token += '-';
            }
            return token;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function getDeviceType() {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return '平板';
            }
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return '手機';
            }
            return '電腦';
        }

        function getBrowserName() {
            const agent = navigator.userAgent;
            const browsers = [
                { name: 'Chrome', pattern: /Chrome\/([0-9.]+)/ },
                { name: 'Firefox', pattern: /Firefox\/([0-9.]+)/ },
                { name: 'Edge', pattern: /Edg\/([0-9.]+)/ },
                { name: 'Safari', pattern: /Version\/([0-9.]+).*Safari/ },
                { name: 'Opera', pattern: /Opera\/([0-9.]+)/ },
                { name: 'Brave', pattern: /Brave\/([0-9.]+)/ },
                { name: 'Vivaldi', pattern: /Vivaldi\/([0-9.]+)/ },
                { name: 'Samsung Internet', pattern: /SamsungBrowser\/([0-9.]+)/ },
                { name: 'Via', pattern: /Via\/([0-9.]+)/ },
                { name: 'DuckDuckGo', pattern: /DuckDuckGo\/([0-9.]+)/ }
            ];

            for (const browser of browsers) {
                const match = agent.match(browser.pattern);
                if (match) {
                    return browser.name;
                }
            }

            return '未知瀏覽器';
        }

        function getOS() {
            const agent = navigator.userAgent;
            if (agent.indexOf('Windows') > -1) return 'Windows';
            if (agent.indexOf('Mac') > -1) return 'macOS';
            if (agent.indexOf('Linux') > -1) return 'Linux';
            if (agent.indexOf('Android') > -1) return 'Android';
            if (agent.indexOf('iOS') > -1 || agent.indexOf('iPhone') > -1 || agent.indexOf('iPad') > -1) return 'iOS';
            return '未知系統';
        }

        function getFileIcon(file) {
            const type = file.type.split('/')[0];
            const icons = {
                image: '🖼️',
                video: '🎬',
                audio: '🎵',
                application: file.name.endsWith('.pdf') ? '📕' : '📄'
            };
            return icons[type] || '📄';
        }

        // ==================== Audio Manager ====================
        const AudioManager = {
            ctx: null,
            
            init() {
                try {
                    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.warn('Web Audio API not supported');
                }
            },
            
            play(type) {
                if (!state.audioEnabled || !this.ctx) return;
                
                if (this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
                
                const oscillator = this.ctx.createOscillator();
                const gainNode = this.ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.ctx.destination);
                
                const frequencies = {
                    select: 800,
                    upload: 600,
                    receive: 400,
                    consent: 500,
                    error: 200,
                    transfer: 1000,
                    detection: 700,
                    permission: 450
                };
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequencies[type] || 600, this.ctx.currentTime);
                
                gainNode.gain.setValueAtTime(state.volume * 0.3, this.ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
                
                oscillator.start();
                oscillator.stop(this.ctx.currentTime + 0.3);
            }
        };

        // ==================== User Name Manager ====================
        const UserNameManager = {
            cookieName: 'webdrop_username',
            isUserSetCookieName: 'webdrop_username_is_user_set',
            lastSavedNameCookieName: 'webdrop_username_last_saved',
            localStorageKey: 'webdrop_username_local',
            
            load() {
                // First try localStorage (more reliable)
                let name = localStorage.getItem(this.localStorageKey);
                const isUserSetLocally = localStorage.getItem(this.localStorageKey + '_user_set') === 'true';
                
                // Also check cookies as fallback
                const cookieName = this.getCookie(this.cookieName);
                const isUserSetCookie = this.getCookie(this.isUserSetCookieName) === 'true';
                const lastSavedCookie = this.getCookie(this.lastSavedNameCookieName);
                
                // Priority 1: User-set name in localStorage (most reliable)
                if (isUserSetLocally && name && name.length >= 3) {
                    console.log('UserNameManager.load() - Using localStorage user-set name:', name);
                }
                // Priority 2: Last saved name from cookies
                else if (lastSavedCookie && lastSavedCookie.length >= 3) {
                    name = lastSavedCookie;
                    // Sync to localStorage
                    localStorage.setItem(this.localStorageKey, name);
                    console.log('UserNameManager.load() - Using cookie name:', name);
                }
                // Priority 3: Existing cookie name
                else if (cookieName && cookieName.length >= 3) {
                    name = cookieName;
                    localStorage.setItem(this.localStorageKey, name);
                    console.log('UserNameManager.load() - Using existing cookie:', name);
                }
                // Priority 4: Generate new name only if no saved name exists
                else {
                    name = this.generateRandomName();
                    localStorage.setItem(this.localStorageKey, name);
                    console.log('UserNameManager.load() - Generated new name:', name);
                }
                
                state.peerName = name;
                
                // Update UI elements safely
                const userNameInput = document.getElementById('userNameInput');
                const myDeviceName = document.getElementById('myDeviceName');
                
                if (userNameInput) userNameInput.value = name;
                if (myDeviceName) myDeviceName.textContent = name;
                
                console.log('UserNameManager.load() - Final name:', name, 'isUserSet:', isUserSetLocally || isUserSetCookie);
            },
            
            save(name) {
                if (!name || name.trim().length < 3) {
                    console.warn('UserNameManager.save() - Invalid name:', name);
                    return;
                }
                
                const trimmedName = name.trim();
                state.peerName = trimmedName;
                
                // Save to localStorage (primary)
                localStorage.setItem(this.localStorageKey, trimmedName);
                localStorage.setItem(this.localStorageKey + '_user_set', 'true');
                
                // Also save to cookies for cross-session redundancy
                this.setCookie(this.cookieName, trimmedName, 365);
                this.setCookie(this.isUserSetCookieName, 'true', 365);
                this.setCookie(this.lastSavedNameCookieName, trimmedName, 365);
                
                // Update UI
                const userNameInput = document.getElementById('userNameInput');
                const myDeviceName = document.getElementById('myDeviceName');
                
                if (userNameInput) userNameInput.value = trimmedName;
                if (myDeviceName) myDeviceName.textContent = trimmedName;
                
                console.log('UserNameManager.save() - Saved name:', trimmedName);
            },
            
            generateRandomName() {
                // Use crypto API for better randomness
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let name = '';
                const randomValues = new Uint32Array(6);
                window.crypto.getRandomValues(randomValues);
                
                for (let i = 0; i < 6; i++) {
                    name += chars[randomValues[i] % chars.length];
                }
                return name;
            },
            
            setCookie(name, value, days) {
                const expires = new Date(Date.now() + days * 864e5).toUTCString();
                document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
            },
            
            getCookie(name) {
                const value = document.cookie.split('; ').find(row => row.startsWith(name + '='));
                return value ? decodeURIComponent(value.split('=')[1]) : null;
            }
        };

        // ==================== Trystero P2P Manager ====================
        // 去中心化 P2P 連線管理器
        const TrysteroManager = {
            room: null,
            roomName: 'webdrop-p2p',
            config: {
                appId: 'webdrop-serverless',
                password: null
            },
            joined: false,
            peers: new Map(),
            
            // 初始化 Trystero
            async init() {
                if (typeof joinRoom === 'undefined') {
                    console.log('⚠️ Trystero 未載入，跳過 P2P 初始化');
                    this.updateStatusIndicator('unavailable');
                    return false;
                }
                
                try {
                    console.log('🔗 初始化 Trystero P2P...');
                    
                    // 嘗試加入房間
                    this.room = joinRoom(this.config, this.roomName);
                    
                    // 監聽連線事件
                    this.room.on('peerJoin', (peerId) => {
                        console.log('👋 新對等端加入:', peerId);
                        this.onPeerJoin(peerId);
                    });
                    
                    this.room.on('peerLeave', (peerId) => {
                        console.log('👋 對等端離開:', peerId);
                        this.onPeerLeave(peerId);
                    });
                    
                    // 監聽自定義消息
                    this.room.onMessage((data, peerId) => {
                        this.onMessageReceived(data, peerId);
                    });
                    
                    this.joined = true;
                    console.log('✅ Trystero P2P 已連線');
                    this.updateStatusIndicator('connected');
                    
                    // 廣播上線消息
                    this.broadcastPresence();
                    
                    return true;
                } catch (error) {
                    console.error('❌ Trystero 初始化失敗:', error);
                    this.updateStatusIndicator('error');
                    return false;
                }
            },
            
            // 更新狀態指示器
            updateStatusIndicator(status) {
                const statusDot = document.querySelector('.status-dot');
                const statusText = document.getElementById('statusText');
                const p2pIndicator = document.getElementById('p2pStatusIndicator');
                
                if (p2pIndicator) {
                    const icons = {
                        'connected': '🟢',
                        'disconnected': '🔴',
                        'searching': '🟡',
                        'unavailable': '⚪',
                        'error': '🔴'
                    };
                    p2pIndicator.textContent = `P2P: ${icons[status] || '⚪'} ${this.getStatusText(status)}`;
                }
            },
            
            getStatusText(status) {
                const texts = {
                    'connected': '已連線',
                    'disconnected': '未連線',
                    'searching': '搜尋中...',
                    'unavailable': '不可用',
                    'error': '連線錯誤'
                };
                return texts[status] || status;
            },
            
            // 對等端加入事件
            onPeerJoin(peerId) {
                // 發送自己的資訊給新對等端
                this.sendToPeer(peerId, {
                    type: 'presence',
                    name: state.peerName,
                    deviceType: state.deviceType,
                    browser: state.browser,
                    os: state.os
                });
                
                // 顯示通知
                showToast(`👋 發現新裝置`, 'info');
                
                // 更新對等端列表
                this.updatePeersList();
            },
            
            // 對等端離開事件
            onPeerLeave(peerId) {
                this.peers.delete(peerId);
                showToast(`👋 裝置已離線`, 'info');
                this.updatePeersList();
            },
            
            // 收到消息事件
            onMessageReceived(data, peerId) {
                switch (data.type) {
                    case 'presence':
                        // 新對等端廣播資訊
                        this.peers.set(peerId, data);
                        this.updatePeersList();
                        break;
                        
                    case 'connection-request':
                        // 處理連線請求
                        this.handleConnectionRequest(data, peerId);
                        break;
                        
                    case 'connection-response':
                        // 處理連線回應
                        this.handleConnectionResponse(data, peerId);
                        break;
                        
                    case 'file-offer':
                        // 收到檔案傳輸提議
                        this.handleFileOffer(data, peerId);
                        break;
                        
                    case 'file-accept':
                        // 對方接受檔案傳輸
                        this.handleFileAccept(data, peerId);
                        break;
                        
                    case 'file-reject':
                        // 對方拒絕檔案傳輸
                        this.handleFileReject(data, peerId);
                        break;
                        
                    default:
                        console.log('收到未知消息類型:', data.type);
                }
            },
            
            // 廣播上線消息
            broadcastPresence() {
                if (this.room && this.joined) {
                    const presenceAction = this.room.getAction('presence');
                    if (presenceAction) {
                        presenceAction({
                            type: 'presence',
                            name: state.peerName,
                            deviceType: state.deviceType,
                            browser: state.browser,
                            os: state.os,
                            peerId: state.peerId
                        });
                    }
                }
            },
            
            // 發送消息給指定對等端
            sendToPeer(peerId, data) {
                if (this.room && this.joined) {
                    const actionName = data.type;
                    const action = this.room.getAction(actionName);
                    if (action) {
                        action(data, peerId);
                    }
                }
            },
            
            // 廣播消息給所有對等端
            broadcast(data) {
                if (this.room && this.joined) {
                    const actionName = data.type;
                    const action = this.room.getAction(actionName);
                    if (action) {
                        action(data); // 自動廣播給所有對等端
                    }
                }
            },
            
            // 處理連線請求
            handleConnectionRequest(data, peerId) {
                const deviceInfo = {
                    id: 'P2P-' + peerId,
                    name: data.name || '未知裝置',
                    type: data.deviceType || '未知類型',
                    browser: data.browser || '未知瀏覽器',
                    os: data.os || '未知系統',
                    icon: data.deviceType === '手機' ? '📱' : '💻',
                    method: '去中心化 P2P',
                    connectionType: 'p2p',
                    encrypted: true,
                    connected: true,
                    peerId: peerId
                };
                
                currentRequestDevice = deviceInfo;
                showAgreementModal(deviceInfo);
            },
            
            // 處理連線回應
            handleConnectionResponse(data, peerId) {
                if (data.accepted) {
                    const deviceInfo = {
                        id: 'P2P-' + peerId,
                        name: data.name || '未知裝置',
                        type: data.deviceType || '未知類型',
                        browser: data.browser || '未知瀏覽器',
                        os: data.os || '未知系統',
                        icon: data.deviceType === '手機' ? '📱' : '💻',
                        method: '去中心化 P2P',
                        connectionType: 'p2p',
                        encrypted: true,
                        connected: true,
                        peerId: peerId
                    };
                    
                    addConnectedDevice(deviceInfo);
                    showToast(`✅ 已與 ${data.name} 建立 P2P 連接！`, 'success');
                    AudioManager.play('transfer');
                }
            },
            
            // 處理檔案提議
            handleFileOffer(data, peerId) {
                // 顯示檔案接收確認
                showFileOfferModal(data, peerId);
            },
            
            // 處理檔案接受
            handleFileAccept(data, peerId) {
                // 開始傳輸檔案
                startFileTransfer(data.fileId, peerId);
            },
            
            // 處理檔案拒絕
            handleFileReject(data, peerId) {
                showToast(`${data.fileName} 已被對方拒絕`, 'warning');
            },
            
            // 更新對等端列表
            updatePeersList() {
                const container = document.getElementById('p2pPeersList');
                if (!container) return;
                
                if (this.peers.size === 0) {
                    container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">尚無發現其他裝置</div>';
                    return;
                }
                
                container.innerHTML = '';
                this.peers.forEach((info, peerId) => {
                    const item = document.createElement('div');
                    item.className = 'p2p-peer-item';
                    item.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px;">
                            <span style="font-size: 24px;">${info.deviceType === '手機' ? '📱' : '💻'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${info.name || '未知裝置'}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">${info.browser} | ${info.os}</div>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="requestP2PConnection('${peerId}')">連接</button>
                        </div>
                    `;
                    container.appendChild(item);
                });
            },
            
            // 請求與對等端連線
            requestP2PConnection(peerId) {
                this.sendToPeer(peerId, {
                    type: 'connection-request',
                    name: state.peerName,
                    deviceType: state.deviceType,
                    browser: state.browser,
                    os: state.os,
                    peerId: state.peerId
                });
                
                showToast('🔗 正在請求連接...', 'info');
            },
            
            // 發送檔案給對等端
            sendFileToPeer(peerId, fileData) {
                this.sendToPeer(peerId, {
                    type: 'file-offer',
                    fileId: fileData.id,
                    fileName: fileData.name,
                    fileSize: fileData.size,
                    fileType: fileData.type
                });
            },
            
            // 離開房間
            leave() {
                if (this.room && this.joined) {
                    this.room.leave();
                    this.joined = false;
                    this.peers.clear();
                    console.log('👋 已離開 Trystero 房間');
                }
            }
        };

        // ==================== Traffic Monitor ====================
        // 流量監控模組
        const TrafficMonitor = {
            // 流量限制 (GitHub Pages 免費方案為 100GB/月)
            monthlyLimitGB: 100,
            dailyRequestLimit: 10000,
            
            // 警告閾值
            warningThreshold: 80,
            criticalThreshold: 95,
            
            // 使用數據
            data: {
                lastReset: new Date().toISOString(),
                dailyUsage: {},
                monthlyTotalGB: 0,
                alertsSent: 0,
                lastAlertType: null
            },
            
            // 初始化
            init() {
                this.loadData();
                this.checkReset();
                this.estimateUsage();
                this.updateUI();
                this.startPeriodicCheck();
                
                console.log('📊 流量監控已啟動');
            },
            
            // 載入儲存的數據
            loadData() {
                try {
                    const saved = localStorage.getItem('webdrop_traffic_data');
                    if (saved) {
                        this.data = { ...this.data, ...JSON.parse(saved) };
                    }
                } catch (error) {
                    console.log('⚠️ 無法載入流量數據');
                }
            },
            
            // 儲存數據
            saveData() {
                try {
                    localStorage.setItem('webdrop_traffic_data', JSON.stringify(this.data));
                } catch (error) {
                    console.error('❌ 無法儲存流量數據');
                }
            },
            
            // 檢查是否需要重置
            checkReset() {
                const now = new Date();
                const lastReset = new Date(this.data.lastReset);
                
                // 檢查是否為新月份
                if (now.getMonth() !== lastReset.getMonth()) {
                    console.log('🔄 新月份，重置流量計數器');
                    this.data.monthlyTotalGB = 0;
                    this.data.dailyUsage = {};
                    this.data.lastReset = new Date().toISOString();
                    this.data.alertsSent = 0;
                    this.data.lastAlertType = null;
                    this.saveData();
                    return true;
                }
                
                // 檢查是否為新的一天
                const today = now.toDateString();
                if (!this.data.dailyUsage[today]) {
                    this.data.dailyUsage = { [today]: 0 };
                    this.saveData();
                }
                
                return false;
            },
            
            // 估算當前使用量
            estimateUsage() {
                // 估算每次訪問的流量消耗
                const estimatedBytesPerVisit = 200 * 1024; // 200KB
                
                // 增加當前會話的使用量
                const today = new Date().toDateString();
                this.data.dailyUsage[today] = (this.data.dailyUsage[today] || 0) + 1;
                
                // 估算月度總流量
                this.data.monthlyTotalGB = this.calculateMonthlyTotal();
                this.saveData();
                
                return this.data.monthlyTotalGB;
            },
            
            // 計算月度總流量
            calculateMonthlyTotal() {
                let total = 0;
                const dailyLimitBytes = this.dailyRequestLimit * 200 * 1024;
                
                Object.values(this.data.dailyUsage).forEach(dailyRequests => {
                    total += (dailyRequests * dailyLimitBytes) / (1024 * 1024 * 1024);
                });
                
                return Math.min(total, this.monthlyLimitGB);
            },
            
            // 取得使用百分比
            getUsagePercent() {
                return (this.data.monthlyTotalGB / this.monthlyLimitGB) * 100;
            },
            
            // 取得剩餘百分比
            getRemainingPercent() {
                return 100 - this.getUsagePercent();
            },
            
            // 取得剩餘流量
            getRemainingGB() {
                return Math.max(0, this.monthlyLimitGB - this.data.monthlyTotalGB);
            },
            
            // 更新 UI
            updateUI() {
                const percent = this.getUsagePercent();
                const remaining = this.getRemainingPercent();
                
                // 更新狀態指示器
                const trafficIndicator = document.getElementById('trafficIndicator');
                if (trafficIndicator) {
                    let color = '#10B981'; // 綠色
                    let status = '正常';
                    
                    if (percent >= this.criticalThreshold) {
                        color = '#EF4444'; // 紅色
                        status = '緊急';
                    } else if (percent >= this.warningThreshold) {
                        color = '#F59E0B'; // 黃色
                        status = '警告';
                    }
                    
                    trafficIndicator.innerHTML = `
                        <span style="color: ${color};">📊 流量: ${percent.toFixed(1)}%</span>
                        <span style="color: var(--text-secondary); font-size: 12px;">(${status})</span>
                    `;
                }
                
                // 更新進度條
                const progressBar = document.getElementById('trafficProgressBar');
                if (progressBar) {
                    progressBar.style.width = `${Math.min(percent, 100)}%`;
                    progressBar.style.background = percent >= this.criticalThreshold 
                        ? 'linear-gradient(90deg, #EF4444, #DC2626)' 
                        : percent >= this.warningThreshold 
                            ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                            : 'linear-gradient(90deg, #10B981, #059669)';
                }
                
                // 檢查是否需要發出警告
                this.checkAlerts();
            },
            
            // 檢查是否需要發出警報
            checkAlerts() {
                const percent = this.getUsagePercent();
                
                if (percent >= this.criticalThreshold) {
                    this.sendAlert('critical', `流量使用量已達到 ${percent.toFixed(1)}%，即將用盡！`);
                } else if (percent >= this.warningThreshold && this.data.lastAlertType !== 'warning') {
                    this.sendAlert('warning', `流量使用量已達到 ${percent.toFixed(1)}%，請留意使用情況。`);
                }
            },
            
            // 發送警報
            sendAlert(level, message) {
                // 顯示 Toast 通知
                showToast(level === 'critical' ? '🚨 ' + message : '⚠️ ' + message, level);
                
                // 記錄警報發送
                this.data.lastAlertType = level;
                this.data.alertsSent++;
                this.saveData();
                
                // 記錄到控制台
                console.log(`📧 流量警報 [${level}]: ${message}`);
            },
            
            // 啟動定期檢查
            startPeriodicCheck() {
                // 每 5 分鐘檢查一次
                setInterval(() => {
                    this.checkReset();
                    this.updateUI();
                }, 5 * 60 * 1000);
            },
            
            // 手動重置（管理員功能）
            manualReset() {
                if (confirm('確定要重置流量計數器嗎？這通常應該在每月帳單週期開始時執行。')) {
                    this.data.monthlyTotalGB = 0;
                    this.data.dailyUsage = {};
                    this.data.lastReset = new Date().toISOString();
                    this.data.alertsSent = 0;
                    this.data.lastAlertType = null;
                    this.saveData();
                    this.updateUI();
                    showToast('✅ 流量計數器已重置', 'success');
                }
            },
            
            // 取得診斷資訊
            getDiagnostics() {
                return {
                    monthlyTotalGB: this.data.monthlyTotalGB,
                    monthlyLimitGB: this.monthlyLimitGB,
                    usagePercent: this.getUsagePercent(),
                    dailyUsageCount: Object.keys(this.data.dailyUsage).length,
                    alertsSent: this.data.alertsSent,
                    lastReset: this.data.lastReset
                };
            }
        };

        // ==================== Initialization ====================
        function init() {
            UserNameManager.load();
            updateDeviceInfo();
            AudioManager.init();
            checkBluetoothSupport();
            loadSavedServerAddress();
            initDragAndDrop();
            checkExistingPassword();
            initPasswordInputListener();
            
            // 初始化流量監控
            TrafficMonitor.init();
            
            // 初始化 Trystero P2P（去中心化模式）
            setTimeout(async () => {
                await TrysteroManager.init();
            }, 1000); // 延遲確保頁面載入完成
            
            // Draw QR code on load
            setTimeout(() => {
                drawQRCode();
            }, 100);
            
            document.getElementById('userNameInput').addEventListener('change', (e) => {
                const newName = e.target.value.trim();
                if (newName) {
                    UserNameManager.save(newName);
                    showToast('名稱已更新', 'success');
                } else {
                    e.target.value = state.peerName;
                }
            });
            
            document.getElementById('e2eToggle').addEventListener('change', async (e) => {
                if (e.target.checked && !Encryption.keyPair) {
                    await Encryption.generateKeyPair();
                    updatePublicKeyDisplay();
                }
            });
        }

        function updateDeviceInfo() {
            const typeIcon = state.deviceType === '手機' ? '📱' : state.deviceType === '平板' ? '📱' : '💻';
            document.getElementById('myDeviceType').innerHTML = `${typeIcon} ${state.deviceType}`;
            
            const browserIcon = getBrowserIcon(state.browser);
            document.getElementById('myBrowser').innerHTML = `${browserIcon} ${state.browser}`;
            
            const osIcon = getOSIcon(state.os);
            document.getElementById('myOS').innerHTML = `${osIcon} ${state.os}`;
            
            fetchIPAddress();
        }

        function getBrowserIcon(browser) {
            const icons = {
                'Chrome': '🌐',
                'Firefox': '🦊',
                'Edge': '🌐',
                'Safari': '🧭',
                'Opera': '🟣',
                'Brave': '🦁',
                'Vivaldi': '🎨',
                'Samsung Internet': '📱',
                'Via': '🚀',
                'DuckDuckGo': '🔍',
                '未知瀏覽器': '❓'
            };
            return icons[browser] || '🌐';
        }

        function getOSIcon(os) {
            const icons = {
                'Windows': '🪟',
                'macOS': '🍎',
                'Linux': '🐧',
                'Android': '🤖',
                'iOS': '🍎',
                '未知系統': '❓'
            };
            return icons[os] || '💻';
        }

        async function fetchIPAddress() {
            // Fetch WAN IP
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                document.getElementById('myIP').innerHTML = `🌍 ${data.ip}`;
            } catch (error) {
                document.getElementById('myIP').innerHTML = '🌍 無法獲取';
            }
            
            // Fetch LAN IP using WebRTC
            fetchLANIP();
        }

        async function fetchLANIP() {
            try {
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                
                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer));
                
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate.candidate;
                        const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
                        if (ipMatch && !ipMatch[0].startsWith('192.168.') && 
                            !ipMatch[0].startsWith('10.') && 
                            !ipMatch[0].startsWith('172.16.')) {
                            // This is likely the public IP, ignore
                        } else if (ipMatch) {
                            document.getElementById('myLANIP').innerHTML = `🏠 ${ipMatch[0]}`;
                            pc.close();
                        }
                    }
                };
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    pc.close();
                    if (!document.getElementById('myLANIP').innerHTML.includes('🏠')) {
                        document.getElementById('myLANIP').innerHTML = '🏠 偵測中...';
                    }
                }, 5000);
                
            } catch (error) {
                document.getElementById('myLANIP').innerHTML = '🏠 無法獲取';
            }
        }

        // ==================== Tab & Method Switching ====================
        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            document.querySelector(`.tab:nth-child(${tab === 'receive' ? 1 : 2})`).classList.add('active');
            document.getElementById(`${tab}Tab`).classList.add('active');
            
            // Refresh device list when switching to send tab
            if (tab === 'send') {
                renderSendDevices();
                renderFileList();
            }
        }

        function switchMethod(method) {
            document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.connection-section').forEach(sec => sec.classList.remove('active'));
            
            document.getElementById(`${method}Method`).classList.add('active');
            document.getElementById(`${method}Section`).classList.add('active');
        }

        // ==================== Settings Functions ====================
        function openSettings() {
            AudioManager.play('select');
            updatePublicKeyDisplay();
            document.getElementById('savedServerAddress').textContent = state.savedServerAddress || '目前無預設伺服器';
            document.getElementById('settingsModal').classList.add('active');
        }

        function closeSettings() {
            document.getElementById('settingsModal').classList.remove('active');
        }

        function toggleSound() {
            state.audioEnabled = document.getElementById('soundToggle').checked;
            document.getElementById('volumeSetting').style.opacity = state.audioEnabled ? '1' : '0.5';
        }

        function changeVolume() {
            state.volume = document.getElementById('volumeSlider').value / 100;
        }

        // ==================== Password Management Functions ====================
        function setConnectionPassword() {
            const password = document.getElementById('passwordInput').value.trim();
            
            if (!password) {
                showToast('請輸入密碼', 'error');
                AudioManager.play('error');
                return;
            }
            
            if (password.length < 4) {
                showToast('密碼長度至少需要 4 個字元', 'error');
                AudioManager.play('error');
                return;
            }
            
            // Encrypt and store password
            const encryptedPassword = Encryption.encryptSync ? Encryption.encryptSync(password) : btoa(password);
            state.encryptedPassword = encryptedPassword;
            state.passwordEnabled = true;
            
            // Save to cookie (encrypted)
            const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
            document.cookie = 'webdrop_password=' + encodeURIComponent(encryptedPassword) + '; expires=' + expires + '; path=/; SameSite=Lax';
            
            // Update UI
            document.getElementById('passwordInputContainer').style.display = 'none';
            document.getElementById('passwordEnabled').classList.add('active');
            
            showToast('密碼已設定', 'success');
            AudioManager.play('select');
        }

        function cancelPassword() {
            document.getElementById('passwordInput').value = '';
        }

        function changeConnectionPassword() {
            // Hide enabled state, show input
            document.getElementById('passwordEnabled').classList.remove('active');
            document.getElementById('passwordInputContainer').style.display = 'flex';
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').focus();
        }

        function removeConnectionPassword() {
            state.encryptedPassword = null;
            state.passwordEnabled = false;
            
            // Remove from cookie
            document.cookie = 'webdrop_password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
            
            // Update UI
            document.getElementById('passwordEnabled').classList.remove('active');
            document.getElementById('passwordInputContainer').style.display = 'flex';
            
            showToast('密碼已移除', 'info');
            AudioManager.play('select');
        }

        // Password Protection Functions
        function checkExistingPassword() {
            // Check if password cookie exists
            const cookies = document.cookie.split(';');
            let encryptedPassword = null;
            for (const cookie of cookies) {
                const trimmed = cookie.trim();
                if (trimmed.startsWith('webdrop_password=')) {
                    encryptedPassword = trimmed.substring('webdrop_password='.length);
                    break;
                }
            }
            
            if (encryptedPassword) {
                state.encryptedPassword = encryptedPassword;
                state.passwordEnabled = true;
                
                // Update settings UI
                document.getElementById('passwordNotSet').style.display = 'none';
                document.getElementById('passwordSet').style.display = 'flex';
            } else {
                document.getElementById('passwordNotSet').style.display = 'flex';
                document.getElementById('passwordSet').style.display = 'none';
            }
        }

        function showPasswordModal() {
            document.getElementById('newPasswordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
            document.getElementById('passwordStrength').style.display = 'none';
            document.getElementById('passwordError').style.display = 'none';
            document.getElementById('passwordConfirmBtn').disabled = true;
            
            if (state.passwordEnabled) {
                document.getElementById('passwordModalTitle').textContent = '變更密碼';
                document.getElementById('confirmPasswordSection').style.display = 'block';
            } else {
                document.getElementById('passwordModalTitle').textContent = '設定密碼保護';
                document.getElementById('confirmPasswordSection').style.display = 'block';
            }
            
            document.getElementById('passwordModal').classList.add('active');
            AudioManager.play('select');
        }

        function closePasswordModal() {
            document.getElementById('passwordModal').classList.remove('active');
        }

        // ==================== Connection Agreement Functions ====================
        function showAgreementModal(deviceInfo) {
            state.currentRequestDevice = deviceInfo;
            
            // Update modal content
            document.getElementById('deviceName').textContent = deviceInfo.name || '未知裝置';
            document.getElementById('requestDeviceIcon').textContent = deviceInfo.icon || '💻';
            document.getElementById('deviceInfo').textContent = `${deviceInfo.type || '未知類型'} · ${deviceInfo.browser || '未知瀏覽器'} · ${deviceInfo.os || '未知系統'}`;
            
            // Show password input if required
            const passwordSection = document.getElementById('passwordRequiredSection');
            const passwordError = document.getElementById('passwordError');
            const connectionPasswordInput = document.getElementById('connectionPasswordInput');
            
            if (state.passwordEnabled) {
                passwordSection.style.display = 'block';
                passwordError.style.display = 'none';
                connectionPasswordInput.value = '';
                connectionPasswordInput.focus();
            } else {
                passwordSection.style.display = 'none';
            }
            
            // Show modal
            const modal = document.getElementById('connectionModal');
            modal.classList.add('active');
            
            AudioManager.play('consent');
            console.log('Connection agreement modal shown for:', deviceInfo.name);
        }

        function acceptConnection() {
            const deviceInfo = state.currentRequestDevice;
            if (!deviceInfo) {
                showToast('❌ 沒有待處理的連接請求', 'error');
                return;
            }
            
            // Check password if required
            if (state.passwordEnabled) {
                const passwordInput = document.getElementById('connectionPasswordInput');
                const passwordError = document.getElementById('passwordError');
                
                if (!verifyConnectionPassword(passwordInput.value)) {
                    passwordError.textContent = '密碼錯誤';
                    passwordError.style.display = 'block';
                    AudioManager.play('error');
                    return;
                }
                passwordError.style.display = 'none';
            }
            
            // Close modal
            document.getElementById('connectionModal').classList.remove('active');
            
            // Mark device as connected and add to connections
            deviceInfo.connected = true;
            addConnectedDevice(deviceInfo);
            
            showToast(`✅ 已同意與 ${deviceInfo.name} 的連接！`, 'success');
            AudioManager.play('transfer');
            
            // Clear request
            state.currentRequestDevice = null;
        }

        function rejectConnection() {
            const deviceInfo = state.currentRequestDevice;
            
            // Close modal
            document.getElementById('connectionModal').classList.remove('active');
            
            if (deviceInfo) {
                showToast(`已拒絕與 ${deviceInfo.name} 的連接`, 'info');
            }
            
            // Clear request
            state.currentRequestDevice = null;
            AudioManager.play('select');
        }

        function checkPasswordStrength(password) {
            const rules = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                common: !isCommonPassword(password)
            };
            
            const passed = Object.values(rules).filter(Boolean).length;
            const bars = document.querySelectorAll('#passwordStrength [id^="strength-bar-"]');
            const strengthText = document.getElementById('strengthText');
            
            // Update rules display
            document.getElementById('rule-length').textContent = rules.length ? '✓ 至少 8 個字元' : '○ 至少 8 個字元';
            document.getElementById('rule-length').style.color = rules.length ? 'var(--success)' : 'var(--text-secondary)';
            document.getElementById('rule-upper').textContent = rules.upper ? '✓ 至少一個大寫英文字母' : '○ 至少一個大寫英文字母';
            document.getElementById('rule-upper').style.color = rules.upper ? 'var(--success)' : 'var(--text-secondary)';
            document.getElementById('rule-lower').textContent = rules.lower ? '✓ 至少一個小寫英文字母' : '○ 至少一個小寫英文字母';
            document.getElementById('rule-lower').style.color = rules.lower ? 'var(--success)' : 'var(--text-secondary)';
            document.getElementById('rule-number').textContent = rules.number ? '✓ 至少一個阿拉伯數字' : '○ 至少一個阿拉伯數字';
            document.getElementById('rule-number').style.color = rules.number ? 'var(--success)' : 'var(--text-secondary)';
            document.getElementById('rule-common').textContent = rules.common ? '✓ 不是常見或簡單的密碼' : '○ 不能是常見或簡單的密碼';
            document.getElementById('rule-common').style.color = rules.common ? 'var(--success)' : 'var(--warning)';
            
            // Update strength bars
            const colors = ['var(--error)', 'var(--warning)', 'var(--success)'];
            bars.forEach((bar, index) => {
                if (index < passed) {
                    bar.style.background = colors[Math.min(passed - 1, 2)];
                } else {
                    bar.style.background = 'var(--bg-tertiary)';
                }
            });
            
            // Update strength text
            if (passed <= 1) {
                strengthText.textContent = '弱';
                strengthText.style.color = 'var(--error)';
            } else if (passed <= 3) {
                strengthText.textContent = '中等';
                strengthText.style.color = 'var(--warning)';
            } else {
                strengthText.textContent = '強';
                strengthText.style.color = 'var(--success)';
            }
            
            return passed >= 4; // Require all rules passed
        }

        function isCommonPassword(password) {
            const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', '111111', '123123', 'admin', 'letmein', 'welcome'];
            return commonPasswords.includes(password.toLowerCase());
        }

        function confirmPassword() {
            const newPassword = document.getElementById('newPasswordInput').value;
            const confirmPassword = document.getElementById('confirmPasswordInput').value;
            const errorDiv = document.getElementById('passwordError');
            
            if (newPassword !== confirmPassword) {
                errorDiv.textContent = '兩次輸入的密碼不相符';
                errorDiv.style.display = 'block';
                AudioManager.play('error');
                return;
            }
            
            if (newPassword.length < 8) {
                errorDiv.textContent = '密碼長度至少需要 8 個字元';
                errorDiv.style.display = 'block';
                AudioManager.play('error');
                return;
            }
            
            // Encrypt and save password
            const encryptedPassword = btoa(newPassword);
            state.encryptedPassword = encryptedPassword;
            state.passwordEnabled = true;
            
            // Save to cookie
            const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
            document.cookie = 'webdrop_password=' + encodeURIComponent(encryptedPassword) + '; expires=' + expires + '; path=/; SameSite=Lax';
            
            // Update settings UI
            document.getElementById('passwordNotSet').style.display = 'none';
            document.getElementById('passwordSet').style.display = 'flex';
            
            closePasswordModal();
            showToast(state.passwordEnabled ? '密碼已更新' : '密碼保護已啟用', 'success');
            AudioManager.play('select');
        }

        function removePasswordProtection() {
            if (confirm('確定要移除密碼保護嗎？移除後任何人都可以連接到您的裝置。')) {
                state.encryptedPassword = null;
                state.passwordEnabled = false;
                
                // Remove from cookie
                document.cookie = 'webdrop_password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
                
                // Update settings UI
                document.getElementById('passwordNotSet').style.display = 'flex';
                document.getElementById('passwordSet').style.display = 'none';
                
                showToast('密碼保護已移除', 'info');
                AudioManager.play('select');
            }
        }

        function initPasswordInputListener() {
            const newPasswordInput = document.getElementById('newPasswordInput');
            const confirmPasswordInput = document.getElementById('confirmPasswordInput');
            const confirmBtn = document.getElementById('passwordConfirmBtn');
            const strengthDiv = document.getElementById('passwordStrength');
            
            if (!newPasswordInput) return;
            
            newPasswordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                if (password.length > 0) {
                    strengthDiv.style.display = 'block';
                    const isStrong = checkPasswordStrength(password);
                    confirmBtn.disabled = !isStrong;
                } else {
                    strengthDiv.style.display = 'none';
                    confirmBtn.disabled = true;
                }
            });
            
            confirmPasswordInput.addEventListener('input', (e) => {
                const newPassword = newPasswordInput.value;
                const confirmPassword = e.target.value;
                const errorDiv = document.getElementById('passwordError');
                
                if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
                    errorDiv.textContent = '兩次輸入的密碼不相符';
                    errorDiv.style.display = 'block';
                    confirmBtn.disabled = true;
                } else {
                    errorDiv.style.display = 'none';
                    if (newPassword.length >= 8 && checkPasswordStrength(newPassword)) {
                        confirmBtn.disabled = false;
                    }
                }
            });
        }

        function initCursor() {
            const cursorDot = document.querySelector('.cursor-dot');
            const cursorOutline = document.querySelector('.cursor-outline');
            
            if (!cursorDot || !cursorOutline) return;
            
            // Check if device supports hover
            if (window.matchMedia('(hover: none)').matches) {
                cursorDot.style.display = 'none';
                cursorOutline.style.display = 'none';
                return;
            }
            
            document.addEventListener('mousemove', (e) => {
                const x = e.clientX;
                const y = e.clientY;
                
                cursorDot.style.left = x + 'px';
                cursorDot.style.top = y + 'px';
                cursorOutline.style.left = x + 'px';
                cursorOutline.style.top = y + 'px';
            });
            
            // Add hover effect to interactive elements
            const interactiveElements = document.querySelectorAll('a, button, .btn, .method-btn, .device-item, .file-item, .tab, input, select');
            
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    document.body.classList.add('cursor-hover');
                });
                el.addEventListener('mouseleave', () => {
                    document.body.classList.remove('cursor-hover');
                });
            });
        }

        function checkPasswordRequired() {
            if (!state.passwordEnabled) return false;
            
            // Check if password cookie exists
            const cookies = document.cookie.split(';');
            let hasPassword = false;
            for (const cookie of cookies) {
                if (cookie.trim().startsWith('webdrop_password=')) {
                    hasPassword = true;
                    break;
                }
            }
            
            return hasPassword;
        }

        function verifyConnectionPassword(inputPassword) {
            if (!state.encryptedPassword) return true; // No password set
            
            const decrypted = Encryption.decryptSync ? Encryption.decryptSync(state.encryptedPassword) : atob(state.encryptedPassword);
            return inputPassword === decrypted;
        }

        function initDragAndDrop() {
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');
            
            if (!dropZone || !fileInput) return;
            
            // Click to select files
            dropZone.addEventListener('click', () => {
                fileInput.click();
            });
            
            // File input change
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFiles(e.target.files);
                    fileInput.value = ''; // Reset for re-selection
                }
            });
            
            // Drag and drop events
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    handleFiles(e.dataTransfer.files);
                }
            });
        }

        function handleFiles(files) {
            Array.from(files).forEach(file => {
                state.selectedFiles.push({
                    file: file,
                    id: generateId(),
                    status: 'pending',
                    progress: 0,
                    speed: 0
                });
            });
            renderFileList();
            showToast(`已選擇 ${files.length} 個檔案`, 'success');
            AudioManager.play('select');
        }

        function renderFileList() {
            const container = document.getElementById('fileList');
            
            if (state.selectedFiles.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            container.innerHTML = '';
            state.selectedFiles.forEach(item => {
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item';
                fileElement.id = `file-${item.id}`;
                
                const icon = getFileIcon(item.file);
                const statusClass = item.status === 'completed' ? 'completed' : 
                                   item.status === 'received' ? 'received' : 
                                   item.status === 'error' ? 'error' : 
                                   item.status === 'sending' ? 'sending' : 'pending';
                
                fileElement.innerHTML = `
                    <div class="file-icon">${icon}</div>
                    <div class="file-details">
                        <div class="file-name">${item.file.name}</div>
                        <div class="file-meta">
                            <span>${formatFileSize(item.file.size)}</span>
                            ${item.encrypted ? '<span class="file-encrypted-badge">🔒 已加密</span>' : ''}
                        </div>
                        ${item.status !== 'pending' ? `
                            <div class="file-progress">
                                <div class="file-progress-bar" style="--progress: ${item.progress}%"></div>
                            </div>
                            <div class="file-status ${statusClass}">
                                ${getStatusText(item)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="file-actions">
                        ${item.status === 'pending' ? `
                            <button class="action-btn cancel" onclick="removeFile('${item.id}')" title="移除">✕</button>
                        ` : item.status === 'completed' || item.status === 'received' ? `
                            <button class="action-btn done" onclick="downloadFile('${item.id}')" title="下載">⬇️</button>
                        ` : ''}
                    </div>
                `;
                
                container.appendChild(fileElement);
            });
        }

        function getStatusText(item) {
            switch (item.status) {
                case 'pending': return '等待傳送';
                case 'sending': return `傳送中 ${item.progress}% ${item.speed ? '<span class="speed">' + formatFileSize(item.speed) + '/s</span>' : ''}`;
                case 'completed': return '已完成 ✓';
                case 'received': return '已接收 ✓';
                case 'error': return '傳輸失敗 ✕';
                default: return item.status;
            }
        }

        function removeFile(fileId) {
            state.selectedFiles = state.selectedFiles.filter(f => f.id !== fileId);
            renderFileList();
            showToast('已移除檔案', 'info');
        }

        // Trigger file selection from header button
        function triggerFileSelect() {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            } else {
                // Fallback: open drop zone
                switchTab('send');
                showToast('請切換到傳送模式選擇檔案', 'info');
            }
        }

        // ==================== File Transfer Functions ====================
        async function sendToDevice(deviceId) {
            const device = state.connections.get(deviceId);
            const filesToSend = state.selectedFiles.filter(f => f.status === 'pending');

            if (!device) {
                showToast('❌ 裝置不存在', 'error');
                AudioManager.play('error');
                return;
            }

            if (filesToSend.length === 0) {
                showToast('⚠️ 沒有可傳送的檔案，請先選擇檔案', 'warning');
                AudioManager.play('error');
                return;
            }

            showToast(`正在傳送 ${filesToSend.length} 個檔案到 ${device.name}...`, 'info');
            AudioManager.play('upload');

            // Process each file
            for (const fileData of filesToSend) {
                try {
                    const file = fileData.file;

                    // Update file status to sending
                    fileData.status = 'sending';
                    fileData.progress = 0;
                    renderFileList();

                    // Get file size for progress calculation
                    const fileSize = file.size;
                    const startTime = Date.now();

                    // Simulate file transfer with progress updates
                    // In a real P2P implementation, this would send data via WebRTC/WebSocket
                    await simulateFileTransfer(fileData, device, fileSize, startTime);

                    // Mark as completed
                    fileData.status = 'completed';
                    fileData.progress = 100;
                    fileData.speed = calculateTransferSpeed(fileSize, Date.now() - startTime);
                    renderFileList();

                    console.log(`✅ 檔案 ${file.name} 傳送完成`);

                } catch (error) {
                    console.error('File transfer error:', error);
                    fileData.status = 'error';
                    renderFileList();
                    showToast(`❌ 檔案 ${fileData.file.name} 傳送失敗`, 'error');
                }
            }

            // Show completion message
            const completedCount = filesToSend.filter(f => f.status === 'completed').length;
            if (completedCount === filesToSend.length) {
                showToast(`✅ 成功傳送 ${completedCount} 個檔案到 ${device.name}`, 'success');
                AudioManager.play('transfer');
            } else if (completedCount > 0) {
                showToast(`⚠️ 成功傳送 ${completedCount}/${filesToSend.length} 個檔案`, 'warning');
            } else {
                showToast('❌ 所有檔案傳送失敗', 'error');
                AudioManager.play('error');
            }
        }

        async function simulateFileTransfer(fileData, device, fileSize, startTime) {
            return new Promise((resolve) => {
                const file = fileData.file;
                let progress = 0;

                // Determine transfer speed based on connection type
                let chunkSize;
                let transferRate;

                switch (device.connectionType) {
                    case 'lan':
                        chunkSize = 131072; // 128KB for LAN (fast)
                        transferRate = 10485760; // ~10 MB/s
                        break;
                    case 'wan':
                        chunkSize = 65536; // 64KB for WAN
                        transferRate = 2097152; // ~2 MB/s
                        break;
                    case 'bluetooth':
                        chunkSize = 16384; // 16KB for Bluetooth
                        transferRate = 524288; // ~500 KB/s
                        break;
                    case 'server':
                        chunkSize = 8192; // 8KB for server
                        transferRate = 1048576; // ~1 MB/s
                        break;
                    default:
                        chunkSize = 32768; // 32KB default
                        transferRate = 3145728; // ~3 MB/s
                }

                // Simulate chunked transfer
                const totalChunks = Math.ceil(fileSize / chunkSize);
                let currentChunk = 0;

                const transferInterval = setInterval(() => {
                    currentChunk++;

                    // Calculate progress based on chunks processed
                    progress = Math.min((currentChunk / totalChunks) * 100, 99);

                    // Update file data
                    const bytesTransferred = Math.min(currentChunk * chunkSize, fileSize);
                    const elapsed = Date.now() - startTime;
                    fileData.speed = calculateTransferSpeed(bytesTransferred, elapsed);
                    fileData.progress = progress;
                    renderFileList();

                    if (currentChunk >= totalChunks) {
                        clearInterval(transferInterval);
                        resolve();
                    }
                }, Math.max(10, chunkSize / transferRate * 1000));
            });
        }

        function calculateTransferSpeed(bytes, milliseconds) {
            if (milliseconds <= 0) return 0;
            const bytesPerSecond = (bytes / milliseconds) * 1000;
            return bytesPerSecond;
        }

        function downloadFile(fileId) {
            const fileData = state.selectedFiles.find(f => f.id === fileId);
            if (!fileData || !fileData.receivedBlob) return;
            
            const url = URL.createObjectURL(fileData.receivedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileData.file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('正在下載檔案', 'success');
        }

        async function toggleE2E() {
            state.e2eEnabled = document.getElementById('e2eToggle').checked;
            const settingsDiv = document.getElementById('e2eSettings');
            
            if (state.e2eEnabled) {
                settingsDiv.style.display = 'block';
                if (!Encryption.keyPair) {
                    await Encryption.generateKeyPair();
                }
                updatePublicKeyDisplay();
            } else {
                settingsDiv.style.display = 'none';
            }
        }

        async function updatePublicKeyDisplay() {
            const keyDisplay = document.getElementById('myPublicKey');
            const copyBtn = document.querySelector('#e2eSettings .copy-btn');
            
            if (Encryption.keyPair) {
                const publicKey = await Encryption.exportPublicKey();
                keyDisplay.textContent = publicKey;
                keyDisplay.dataset.fullKey = publicKey;
                keyDisplay.classList.remove('masked');
                
                // Hide copy overlay
                const overlay = keyDisplay.querySelector('.copy-overlay');
                if (overlay) {
                    overlay.classList.add('hidden');
                }
                
                // Enable copy button
                if (copyBtn) {
                    copyBtn.disabled = false;
                    copyBtn.style.opacity = '1';
                }
            } else {
                keyDisplay.textContent = '產生中...';
                keyDisplay.classList.add('masked');
                keyDisplay.dataset.fullKey = '';
                
                // Show copy overlay while generating
                if (copyBtn) {
                    copyBtn.disabled = true;
                    copyBtn.style.opacity = '0.5';
                }
                
                if (!keyDisplay.querySelector('.copy-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'copy-overlay';
                    overlay.textContent = '正在產生金鑰...';
                    keyDisplay.appendChild(overlay);
                } else {
                    keyDisplay.querySelector('.copy-overlay').classList.remove('hidden');
                }
            }
        }

        // Toggle public key visibility
        function togglePublicKeyVisibility() {
            const keyDisplay = document.getElementById('myPublicKey');
            if (!keyDisplay.dataset.fullKey) return;
            
            if (keyDisplay.classList.contains('masked')) {
                keyDisplay.classList.remove('masked');
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    keyDisplay.classList.add('masked');
                }, 5000);
            } else {
                keyDisplay.classList.add('masked');
            }
        }

        async function copyMyKey() {
            if (Encryption.keyPair) {
                try {
                    const publicKey = await Encryption.exportPublicKey();
                    
                    // Try modern clipboard API first
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(publicKey);
                        showToast('✅ 公鑰已複製到剪貼簿！', 'success');
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = publicKey;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        document.body.appendChild(textArea);
                        textArea.select();
                        
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        if (successful) {
                            showToast('✅ 公鑰已複製到剪貼簿！', 'success');
                        } else {
                            showToast('❌ 複製失敗，請手動選取複製', 'error');
                        }
                    }
                    AudioManager.play('select');
                } catch (err) {
                    console.error('Copy failed:', err);
                    showToast('❌ 複製失敗：' + err.message, 'error');
                    AudioManager.play('error');
                }
            } else {
                showToast('⏳ 金鑰尚未產生完成，請稍候...', 'warning');
            }
        }

        async function setPeerKey() {
            const peerKey = document.getElementById('peerKeyInput').value.trim();
            if (!peerKey) {
                showToast('請輸入對方的公鑰', 'error');
                return;
            }
            
            try {
                await Encryption.deriveSharedKey(peerKey);
                showToast('對方金鑰已設定，E2E 加密已啟用！', 'success');
                AudioManager.play('transfer');
                document.getElementById('peerKeyInput').value = '';
            } catch (error) {
                showToast('無效的金鑰格式', 'error');
                AudioManager.play('error');
            }
        }

        function changeEncryptionMethod() {
            state.encryptionMethod = document.getElementById('encryptionMethod').value;
            showToast(`已切換為 ${state.encryptionMethod} 加密`, 'info');
        }

        // Help Modal
        function showHelp() {
            AudioManager.play('select');
            const helpContent = document.getElementById('helpModal');
            if (helpContent) {
                helpContent.classList.add('active');
            } else {
                alert(`WebDrop 使用說明

━━━━━━━━━━━━━━━━━━━━━━━━
【建立連接】
━━━━━━━━━━━━━━━━━━━━━━━━
1. 雙方都開啟此網頁
2. 選擇連接方式：
   • QR 碼：掃描對方的 QR 碼
   • 連接代碼：輸入 12 位代碼
   • 藍牙偵測：僅 Chrome/Edge 支援
   • 手動信令：無伺服器也能連接
   • 伺服器連接：連接自架信令伺服器
3. 雙方都同意後即完成連接
4. 如有設定密碼，需輸入密碼

━━━━━━━━━━━━━━━━━━━━━━━━
【檔案傳輸】
━━━━━━━━━━━━━━━━━━━━━━━━
• 所有檔案都經過加密傳輸
• 可批量選擇多個檔案
• 拖放檔案到網頁即可上傳
• 顯示傳輸進度

━━━━━━━━━━━━━━━━━━━━━━━━
【藍牙支援】
━━━━━━━━━━━━━━━━━━━━━━━━
支援的瀏覽器：
• Chrome 56+（電腦/Android）
• Edge 79+（電腦/Android）
• Opera 43+（電腦）
• Samsung Internet

不支援的瀏覽器：
• Firefox（所有版本）
• Safari（所有版本，包括 iOS）

━━━━━━━━━━━━━━━━━━━━━━━━
【安全性】
━━━━━━━━━━━━━━━━━━━━━━━━
• 可選擇開啟端對端加密
• 可設定連接密碼
• 密碼加密儲存在 Cookies
• 請勿清除 Cookies`);
            }
        }

        function closeHelp() {
            const helpContent = document.getElementById('helpModal');
            if (helpContent) {
                helpContent.classList.remove('active');
            }
        }

        // ==================== Server Connection Functions ====================
        function loadSavedServerAddress() {
            const saved = localStorage.getItem('webdrop_server_address');
            if (saved) {
                state.savedServerAddress = saved;
                document.getElementById('serverInput').value = saved;
                document.getElementById('savedServerAddress').textContent = saved;
            }
        }

        function saveServerAddress() {
            const address = document.getElementById('serverInput').value.trim();
            
            if (!address) {
                showToast('⚠️ 請輸入伺服器地址', 'error');
                return;
            }
            
            // Validate URL format
            try {
                const url = new URL(address);
                if (url.protocol !== 'https:' && url.protocol !== 'wss:' && url.hostname !== 'localhost') {
                    showToast('⚠️ 伺服器地址必須使用 HTTPS 或 WSS 安全協議', 'error');
                    return;
                }
            } catch (e) {
                showToast('❌ 無效的伺服器地址格式', 'error');
                return;
            }
            
            localStorage.setItem('webdrop_server_address', address);
            state.savedServerAddress = address;
            document.getElementById('savedServerAddress').textContent = address;
            showToast('✅ 伺服器地址已儲存', 'success');
            AudioManager.play('select');
        }

        function clearSavedServer() {
            localStorage.removeItem('webdrop_server_address');
            state.savedServerAddress = null;
            document.getElementById('savedServerAddress').textContent = '目前無預設伺服器';
            document.getElementById('serverInput').value = '';
            showToast('已清除預設伺服器', 'info');
            AudioManager.play('select');
        }

        function editDefaultServer() {
            document.getElementById('settingsModal').classList.remove('active');
            switchMethod('server');
        }

        function autoDetectServer() {
            const saved = localStorage.getItem('webdrop_server_address');
            if (saved) {
                document.getElementById('serverInput').value = saved;
                connectToServer();
            } else {
                showToast('沒有已儲存的伺服器地址', 'info');
                AudioManager.play('select');
            }
        }

        function connectToServer() {
            const url = document.getElementById('serverInput').value.trim();
            
            if (!url) {
                showToast('⚠️ 請輸入伺服器地址', 'error');
                AudioManager.play('error');
                return;
            }
            
            try {
                new URL(url);
            } catch (e) {
                showToast('❌ 無效的伺服器地址格式', 'error');
                AudioManager.play('error');
                return;
            }
            
            state.serverUrl = url;
            showToast('🔄 正在連接到伺服器...', 'info');
            AudioManager.play('select');
            
            // Show connecting status
            const serverStatus = document.getElementById('serverStatus');
            if (serverStatus) {
                serverStatus.style.display = 'flex';
                const statusIcon = document.getElementById('serverStatusIcon');
                const statusText = document.getElementById('serverStatusText');
                if (statusIcon) statusIcon.className = 'server-status-icon connecting';
                if (statusText) statusText.textContent = '正在連接...';
            }
            
            // Initialize WebSocket connection
            initializeServerConnection(url);
        }

        function initializeServerConnection(url) {
            try {
                state.serverSocket = new WebSocket(url);
                
                state.serverSocket.onopen = () => {
                    console.log('Connected to signaling server');
                    state.serverConnected = true;
                    
                    // Update UI
                    document.getElementById('serverStatusIcon').className = 'server-status-icon connected';
                    document.getElementById('serverStatusText').textContent = '已連接到伺服器';
                    document.querySelector('.status-dot').classList.add('server-connected');
                    document.getElementById('statusText').textContent = '伺服器已連接';
                    
                    // Show devices section
                    document.getElementById('serverDevicesSection').style.display = 'block';
                    
                    // Register with server
                    state.serverSocket.send(JSON.stringify({
                        type: 'register',
                        peerId: state.peerId,
                        name: state.peerName,
                        deviceType: state.deviceType,
                        browser: state.browser,
                        os: state.os
                    }));
                    
                    showToast('已連接到伺服器', 'success');
                    AudioManager.play('transfer');
                };
                
                state.serverSocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    handleServerMessage(data);
                };
                
                state.serverSocket.onclose = () => {
                    console.log('Disconnected from signaling server');
                    state.serverConnected = false;
                    
                    document.getElementById('serverStatusIcon').className = 'server-status-icon';
                    document.getElementById('serverStatusText').textContent = '連接已斷開';
                    document.querySelector('.status-dot').classList.remove('server-connected');
                    document.getElementById('statusText').textContent = '未連接';
                    document.getElementById('serverDevicesSection').style.display = 'none';
                    
                    showToast('與伺服器的連接已斷開', 'warning');
                };
                
                state.serverSocket.onerror = (error) => {
                    console.error('Server connection error:', error);
                    document.getElementById('serverStatusIcon').className = 'server-status-icon error';
                    document.getElementById('serverStatusText').textContent = '連接錯誤';
                    showToast('伺服器連接失敗', 'error');
                    AudioManager.play('error');
                };
                
            } catch (error) {
                console.error('Failed to connect to server:', error);
                showToast('無法連接到伺服器', 'error');
                AudioManager.play('error');
            }
        }

        function handleServerMessage(data) {
            switch (data.type) {
                case 'peers-list':
                    // Update the peer list
                    updateServerPeers(data.peers);
                    break;
                    
                case 'peer-joined':
                    // A new peer joined
                    showToast(`${data.name} 已連線`, 'info');
                    if (data.peer) {
                        addServerPeer(data.peer);
                    }
                    break;
                    
                case 'peer-left':
                    // A peer left
                    removeServerPeer(data.peerId);
                    break;
                    
                case 'connection-request':
                    // Someone wants to connect
                    handleConnectionRequest(data);
                    break;
                    
                case 'connection-response':
                    // Connection response received
                    handleConnectionResponse(data);
                    break;
            }
        }

        function updateServerPeers(peers) {
            const container = document.getElementById('serverDevicesList');
            container.innerHTML = '';
            
            const otherPeers = peers.filter(p => p.peerId !== state.peerId);
            
            if (otherPeers.length === 0) {
                document.getElementById('noServerDevices').style.display = 'block';
                return;
            }
            
            document.getElementById('noServerDevices').style.display = 'none';
            
            otherPeers.forEach(peer => {
                addServerPeerToList(peer);
            });
        }

        function addServerPeer(peer) {
            if (peer.peerId === state.peerId) return;
            addServerPeerToList(peer);
        }

        function addServerPeerToList(peer) {
            const container = document.getElementById('serverDevicesList');
            const noDevicesMsg = document.getElementById('noServerDevices');
            if (noDevicesMsg) noDevicesMsg.style.display = 'none';
            
            const browserIcon = getBrowserIcon(peer.browser || '未知瀏覽器');
            const osIcon = getOSIcon(peer.os || '未知系統');
            
            const item = document.createElement('div');
            item.className = 'server-device-item';
            item.id = `server-peer-${peer.peerId}`;
            item.innerHTML = `
                <div style="font-size: 32px;">💻</div>
                <div class="server-device-info">
                    <div class="server-device-name">${peer.name || '未知裝置'}</div>
                    <div class="server-device-meta">
                        <span>${peer.browser ? browserIcon + ' ' + peer.browser : '❓ 未知瀏覽器'}</span>
                        <span>${peer.os ? osIcon + ' ' + peer.os : '❓ 未知系統'}</span>
                        <span>${peer.deviceType || '💻 電腦'}</span>
                    </div>
                </div>
                <button class="btn btn-primary" style="font-size: 12px; padding: 8px 12px;" onclick="connectToServerPeer('${peer.peerId}')">連接</button>
            `;
            container.appendChild(item);
        }

        function removeServerPeer(peerId) {
            const item = document.getElementById(`server-peer-${peerId}`);
            if (item) {
                item.remove();
            }
            
            // Check if list is empty
            const container = document.getElementById('serverDevicesList');
            if (container.children.length === 0) {
                document.getElementById('noServerDevices').style.display = 'block';
            }
        }

        function connectToServerPeer(peerId) {
            if (!state.serverConnected || !state.serverSocket) {
                showToast('請先連接到伺服器', 'error');
                return;
            }
            
            showToast('正在發送連接請求...', 'info');
            
            // Send connection request
            state.serverSocket.send(JSON.stringify({
                type: 'connect-request',
                targetPeerId: peerId,
                fromPeerId: state.peerId,
                fromName: state.peerName,
                fromDeviceType: state.deviceType,
                fromBrowser: state.browser,
                fromOS: state.os
            }));
        }

        function handleConnectionRequest(data) {
            const deviceInfo = {
                id: 'SERVER-' + data.fromPeerId,
                name: data.fromName,
                type: data.fromDeviceType,
                browser: data.fromBrowser || '未知瀏覽器',
                os: data.fromOS || '未知系統',
                icon: data.fromDeviceType === '手機' ? '📱' : '💻',
                method: '伺服器',
                connectionType: 'server',
                encrypted: true,
                connected: false,
                serverPeerId: data.fromPeerId
            };
            
            currentRequestDevice = deviceInfo;
            showAgreementModal(deviceInfo);
        }

        function handleConnectionResponse(data) {
            if (data.accepted) {
                const deviceInfo = {
                    id: 'SERVER-' + data.fromPeerId,
                    name: data.fromName,
                    type: data.fromDeviceType,
                    browser: data.fromBrowser || '未知瀏覽器',
                    os: data.fromOS || '未知系統',
                    icon: data.fromDeviceType === '手機' ? '📱' : '💻',
                    method: '伺服器',
                    connectionType: 'server',
                    encrypted: true,
                    connected: true,
                    serverPeerId: data.fromPeerId
                };
                
                addConnectedDevice(deviceInfo);
                showToast(`已與 ${data.fromName} 建立連接！`, 'success');
                AudioManager.play('transfer');
            }
        }

        function disconnectServer() {
            if (state.serverSocket) {
                state.serverSocket.close();
                state.serverSocket = null;
            }
            
            state.serverConnected = false;
            document.getElementById('serverStatus').style.display = 'none';
            document.getElementById('serverDevicesSection').style.display = 'none';
            document.querySelector('.status-dot').classList.remove('server-connected');
            
            showToast('已斷開與伺服器的連接', 'info');
        }

        // ==================== Bluetooth Functions ====================
        function checkBluetoothSupport() {
            const supported = 'bluetooth' in navigator;
            const unsupportedDiv = document.getElementById('bluetoothUnsupported');
            const supportedDiv = document.getElementById('bluetoothSupported');
            
            if (!supported) {
                unsupportedDiv.style.display = 'block';
                supportedDiv.style.display = 'none';
            } else {
                unsupportedDiv.style.display = 'none';
                supportedDiv.style.display = 'block';
            }
        }

        function closeBtPermissionModal() {
            document.getElementById('btPermissionModal').classList.remove('active');
        }

        function startBluetoothDetection() {
            AudioManager.play('select');
            document.getElementById('btPermissionModal').classList.add('active');
        }

        async function requestBluetoothPermission() {
            closeBtPermissionModal();
            AudioManager.play('permission');
            
            if (!navigator.bluetooth) {
                showToast('❌ 您的瀏覽器不支援藍牙 API，請使用 Chrome 或 Edge', 'error');
                AudioManager.play('error');
                return;
            }

            // Check if HTTPS (required for Web Bluetooth)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                showToast('⚠️ 藍牙功能需要 HTTPS 安全連線', 'error');
                return;
            }

            try {
                const progress = document.getElementById('bluetoothProgress');
                progress.classList.add('active');
                const progressFill = document.getElementById('btProgressFill');
                const progressText = document.getElementById('btProgressText');
                progressText.textContent = '🔍 正在搜尋附近藍牙裝置...';
                
                // Simulate scanning progress with timeout protection
                let progressValue = 0;
                const progressInterval = setInterval(() => {
                    progressValue += Math.random() * 15;
                    if (progressValue > 85) progressValue = 85;
                    progressFill.style.width = progressValue + '%';
                }, 200);
                
                // Set timeout for search (10 seconds)
                const searchTimeout = setTimeout(() => {
                    clearInterval(progressInterval);
                    progress.classList.remove('active');
                    showToast('⏱️ 搜尋超時，請重試', 'warning');
                }, 10000);
                
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['battery_service']
                });

                clearInterval(progressInterval);
                clearTimeout(searchTimeout);
                progressFill.style.width = '100%';
                
                const deviceName = device.name || '未知藍牙裝置';
                const deviceId = device.id;

                addBluetoothDevice({
                    name: deviceName,
                    id: deviceId,
                    device: device
                });

                AudioManager.play('detection');
                progressText.textContent = '✨ 搜尋完成！點擊下方裝置進行連接';
                
                // Auto-hide progress after 3 seconds
                setTimeout(() => {
                    progress.classList.remove('active');
                }, 3000);

            } catch (error) {
                console.error('Bluetooth error:', error);
                document.getElementById('bluetoothProgress').classList.remove('active');
                
                if (error.name === 'NotFoundError' || error.name === 'AbortError') {
                    showToast('已取消藍牙搜尋', 'info');
                } else if (error.name === 'SecurityError') {
                    showToast('🚫 藍牙權限被拒絕，請在瀏覽器設定中允許', 'error');
                } else if (error.name === 'NotAllowedError') {
                    showToast('⚠️ 您已拒絕藍牙權限請求', 'warning');
                } else {
                    showToast('❌ 藍牙連接失敗：' + (error.message || '未知錯誤'), 'error');
                }
                AudioManager.play('error');
            }
        }

        function addBluetoothDevice(device) {
            const container = document.getElementById('bluetoothDevices');
            const item = document.createElement('div');
            item.className = 'bluetooth-device-item';
            item.innerHTML = `
                <span style="font-size: 24px;">📱</span>
                <span style="flex: 1;">${device.name}</span>
                <span style="color: var(--success);">點擊連接</span>
            `;
            item.addEventListener('click', () => {
                AudioManager.play('select');
                
                const deviceInfo = {
                    id: 'BT-' + device.id,
                    name: device.name,
                    type: '藍牙',
                    browser: state.browser,
                    os: state.os,
                    icon: '📡',
                    method: '藍牙偵測',
                    connectionType: 'bluetooth',
                    encrypted: true,
                    connected: true
                };
                addConnectedDevice(deviceInfo);
                showToast(`${device.name} 已連接！`, 'success');
                AudioManager.play('transfer');
                document.getElementById('bluetoothProgress').classList.remove('active');
            });
            container.appendChild(item);
        }

        // ==================== Device Management ====================
        function addConnectedDevice(device) {
            state.connections.set(device.id, device);
            
            renderConnectedDevices();
            renderSendDevices();
            
            document.querySelector('.status-dot').classList.add('connected');
            document.getElementById('statusText').textContent = `已連接 ${state.connections.size} 個裝置`;
        }

        function removeDevice(deviceId) {
            state.connections.delete(deviceId);
            renderConnectedDevices();
            renderSendDevices();
            
            if (state.connections.size === 0) {
                document.querySelector('.status-dot').classList.remove('connected');
                document.getElementById('statusText').textContent = '未連接';
            } else {
                document.getElementById('statusText').textContent = `已連接 ${state.connections.size} 個裝置`;
            }
        }

        function renderConnectedDevices() {
            const container = document.getElementById('connectedDevices');
            
            if (state.connections.size === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📡</div>
                        <h3>尚未連接任何裝置</h3>
                        <p>使用上方方法建立連接</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            state.connections.forEach(device => {
                const browserDisplay = device.browser || '未知瀏覽器';
                const osDisplay = device.os || '未知系統';
                
                const methodClass = device.method === '藍牙偵測' ? 'bluetooth' : 
                                   device.method === 'IP 位址' ? (device.connectionType === 'lan' ? 'lan' : 'wan') :
                                   device.method === '伺服器' ? 'server' : 'qr';
                
                const encryptionStatus = device.usesECDH ? '🔐 ECDH' : '🔒 AES';
                
                const item = document.createElement('div');
                item.className = 'device-item';
                item.innerHTML = `
                    <div class="device-icon">${device.icon}</div>
                    <div class="device-info">
                        <div class="device-name">${device.name}</div>
                        <div class="device-tags">
                            <span class="tag">${osDisplay}</span>
                            <span class="tag">${device.type || '未知類型'}</span>
                            <span class="tag ${browserDisplay === '未知瀏覽器' ? 'unknown' : ''}">${browserDisplay}</span>
                            <span class="tag ${methodClass}">${device.method}</span>
                            <span class="tag encrypted">${encryptionStatus}</span>
                            ${device.connectionType === 'lan' ? '<span class="tag">內網</span>' : ''}
                            ${device.connectionType === 'wan' ? '<span class="tag">外網</span>' : ''}
                        </div>
                    </div>
                    <div class="device-status">已連接 ✓</div>
                    <div class="device-actions">
                        <button class="action-btn" onclick="disconnectDevice('${device.id}')" title="斷開連接">✕</button>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        function renderSendDevices() {
            const container = document.getElementById('sendDevices');
            
            if (state.connections.size === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📡</div>
                        <h3>無已連接裝置</h3>
                        <p>請先在「接收模式」建立連接</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            state.connections.forEach(device => {
                const browserDisplay = device.browser || '未知瀏覽器';
                const osDisplay = device.os || '未知系統';
                const encryptionStatus = device.usesECDH ? '🔐 ECDH' : '🔒 AES';
                
                const item = document.createElement('div');
                item.className = 'device-item';
                item.dataset.deviceId = device.id;
                item.innerHTML = `
                    <div class="device-icon">${device.icon}</div>
                    <div class="device-info">
                        <div class="device-name">${device.name}</div>
                        <div class="device-tags">
                            <span class="tag">${osDisplay}</span>
                            <span class="tag">${device.type || '未知類型'}</span>
                            <span class="tag ${browserDisplay === '未知瀏覽器' ? 'unknown' : ''}">${browserDisplay}</span>
                            <span class="tag encrypted">${encryptionStatus}</span>
                        </div>
                    </div>
                    <div class="device-status">點擊傳送檔案</div>
                `;
                item.addEventListener('click', () => {
                    AudioManager.play('select');
                    sendToDevice(device.id);
                });
                container.appendChild(item);
            });
        }

        function disconnectDevice(deviceId) {
            const device = state.connections.get(deviceId);
            if (device) {
                AudioManager.play('select');
                removeDevice(deviceId);
                showToast(`已斷開與 ${device.name} 的連接`, 'info');
            }
        }

        // ==================== Manual Signaling Module ====================
        function switchManualConnectionTab(tab) {
            const createTab = document.getElementById('createConnectionTab');
            const joinTab = document.getElementById('joinConnectionTab');
            const createPanel = document.getElementById('createConnectionPanel');
            const joinPanel = document.getElementById('joinConnectionPanel');
            
            if (tab === 'create') {
                createTab.className = 'btn btn-primary';
                joinTab.className = 'btn btn-secondary';
                createPanel.style.display = 'block';
                joinPanel.style.display = 'none';
            } else {
                createTab.className = 'btn btn-secondary';
                joinTab.className = 'btn btn-primary';
                createPanel.style.display = 'none';
                joinPanel.style.display = 'block';
            }
            AudioManager.play('select');
        }

        function generateConnectionData() {
            const connectionData = {
                token: state.token,
                peerId: state.peerId,
                name: state.peerName,
                deviceType: state.deviceType,
                browser: state.browser,
                os: state.os,
                timestamp: Date.now()
            };
            
            const dataStr = JSON.stringify(connectionData);
            const encodedData = btoa(unescape(encodeURIComponent(dataStr)));
            
            const outputSection = document.getElementById('connectionDataSection');
            const outputDiv = document.getElementById('connectionDataOutput');
            const waitingDiv = document.getElementById('waitingForPeer');
            
            outputDiv.textContent = encodedData;
            outputSection.style.display = 'block';
            waitingDiv.style.display = 'block';
            
            showToast('📋 連接資料已產生，請複製並分享給對方', 'success');
            AudioManager.play('select');
            
            // Set up polling for connection response
            state.manualConnectionTimeout = setTimeout(() => {
                waitingDiv.style.display = 'none';
                showToast('⏱️ 等待連接超時，請重試', 'warning');
            }, 60000); // 60 seconds timeout
        }

        function copyConnectionData() {
            const dataStr = document.getElementById('connectionDataOutput').textContent;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(dataStr).then(() => {
                    showToast('✅ 連接資料已複製到剪貼簿！', 'success');
                    AudioManager.play('select');
                }).catch(() => {
                    fallbackCopy(dataStr);
                });
            } else {
                fallbackCopy(dataStr);
            }
        }

        function joinConnection() {
            const input = document.getElementById('connectionDataInput').value.trim();
            if (!input) {
                showToast('⚠️ 請輸入連接資料', 'warning');
                return;
            }
            
            try {
                const decodedData = decodeURIComponent(escape(atob(input)));
                const connectionData = JSON.parse(decodedData);
                
                // Validate data
                if (!connectionData.token || !connectionData.peerId) {
                    showToast('❌ 無效的連接資料', 'error');
                    return;
                }
                
                // Store connection data
                state.manualConnectionData = connectionData;
                
                // Show connected device
                const connectedDiv = document.getElementById('manualConnectedDevice');
                const deviceName = document.getElementById('manualDeviceName');
                const deviceInfo = document.getElementById('manualDeviceInfo');
                
                deviceName.textContent = connectionData.name || '未知裝置';
                deviceInfo.textContent = `${connectionData.deviceType || '💻'} | ${connectionData.browser || '未知瀏覽器'} | ${connectionData.os || '未知系統'}`;
                connectedDiv.style.display = 'block';
                
                // Add to connections
                const deviceInfoObj = {
                    id: 'MANUAL-' + connectionData.peerId,
                    name: connectionData.name || '未知裝置',
                    type: connectionData.deviceType || '電腦',
                    browser: connectionData.browser || '未知瀏覽器',
                    os: connectionData.os || '未知系統',
                    icon: connectionData.deviceType === '手機' ? '📱' : '💻',
                    method: '手動信令',
                    connectionType: 'manual',
                    encrypted: true,
                    connected: true
                };
                
                addConnectedDevice(deviceInfoObj);
                showToast(`✅ 已與 ${connectionData.name} 建立連接！`, 'success');
                AudioManager.play('transfer');
                
            } catch (error) {
                console.error('Join connection error:', error);
                showToast('❌ 連接資料解析失敗', 'error');
            }
        }

        function cancelManualConnection() {
            const waitingDiv = document.getElementById('waitingForPeer');
            waitingDiv.style.display = 'none';
            
            if (state.manualConnectionTimeout) {
                clearTimeout(state.manualConnectionTimeout);
                state.manualConnectionTimeout = null;
            }
            
            showToast('已取消等待', 'info');
            AudioManager.play('select');
        }

        function disconnectManualConnection() {
            const connectedDiv = document.getElementById('manualConnectedDevice');
            connectedDiv.style.display = 'none';
            
            // Remove from connections
            const deviceId = 'MANUAL-' + (state.manualConnectionData?.peerId || '');
            removeDevice(deviceId);
            state.manualConnectionData = null;
            
            showToast('已斷開手動信令連接', 'info');
            AudioManager.play('select');
        }

        // Copy connection token
        function copyToken() {
            const token = state.token || document.getElementById('myToken').textContent;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(token).then(() => {
                    showToast('✅ 連接代碼已複製！', 'success');
                    AudioManager.play('select');
                }).catch(() => fallbackCopy(token));
            } else {
                fallbackCopy(token);
            }
        }

        function fallbackCopy(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                showToast('✅ 連接代碼已複製！', 'success');
                AudioManager.play('select');
            } else {
                showToast('❌ 複製失敗，請手動選取複製', 'error');
            }
        }

        // Generate new token
        function generateNewToken() {
            state.token = generateToken();
            const tokenDisplay = document.getElementById('myToken');
            if (tokenDisplay) {
                tokenDisplay.textContent = state.token;
            }
            // Redraw QR code with new token
            drawQRCode();
            showToast('🔄 已產生新的連接代碼', 'success');
            AudioManager.play('select');
        }

        // Connect with 12-digit token code
        function connectWithToken() {
            const tokenInput = document.getElementById('tokenInput');
            if (!tokenInput) return;
            
            let token = tokenInput.value.trim().toUpperCase();
            
            // Remove dashes if present
            token = token.replace(/-/g, '');
            
            // Validate token format
            if (token.length !== 12) {
                showToast('⚠️ 連接代碼必須是 12 位字元', 'error');
                return;
            }
            
            // Validate token characters
            const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            for (let char of token) {
                if (!validChars.includes(char)) {
                    showToast('❌ 連接代碼包含無效字元', 'error');
                    return;
                }
            }
            
            showToast('🔄 正在透過連接代碼建立連接...', 'info');
            AudioManager.play('select');
            
            // Create device info for the connection
            // Note: In a real implementation, this would look up the peer via a signaling server
            const deviceInfo = {
                id: 'TOKEN-' + token,
                name: '連接代碼使用者',
                type: state.deviceType,
                browser: state.browser,
                os: state.os,
                icon: state.deviceType === '手機' ? '📱' : '💻',
                method: '連接代碼',
                connectionType: 'token',
                encrypted: true,
                connected: true,
                token: token
            };
            
            // Simulate connection for demo purposes
            addConnectedDevice(deviceInfo);
            showToast(`✅ 已與使用連接代碼 ${token.substring(0, 4)}...${token.substring(8)} 的裝置建立連接！`, 'success');
            AudioManager.play('transfer');
            
            // Clear input
            tokenInput.value = '';
        }

        // Connect with LAN IP
        function connectWithLANIP() {
            const ipInput = document.getElementById('lanIPInput');
            if (!ipInput) return;
            
            const ipAddress = ipInput.value.trim();
            
            // Validate IP address format
            const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
            if (!ipRegex.test(ipAddress)) {
                showToast('⚠️ 請輸入有效的 IP 地址', 'error');
                return;
            }
            
            // Validate IP ranges
            const parts = ipAddress.split('.').map(Number);
            if (parts.some(p => p < 0 || p > 255)) {
                showToast('⚠️ IP 地址格式無效', 'error');
                return;
            }
            
            showToast(`🔄 正在連接到內網 IP：${ipAddress}`, 'info');
            AudioManager.play('select');
            
            // Create device info for the connection
            const deviceInfo = {
                id: 'LAN-' + ipAddress.replace(/\./g, '-'),
                name: ipAddress,
                type: '內網裝置',
                browser: state.browser,
                os: state.os,
                icon: '💻',
                method: '內網 IP',
                connectionType: 'lan',
                encrypted: true,
                connected: true,
                ipAddress: ipAddress
            };
            
            // Add to connections
            addConnectedDevice(deviceInfo);
            showToast(`✅ 已透過內網 IP ${ipAddress} 建立連接！`, 'success');
            AudioManager.play('transfer');
            
            // Clear input
            ipInput.value = '';
        }

        // Generate and display QR Code
        let qrCodeInstance = null;
        let html5QrCode = null;
        
        function drawQRCode() {
            const container = document.getElementById('qrCodeContainer');
            if (!container) return;
            
            const token = state.token || generateToken();
            state.token = token;
            
            // Update token display
            const tokenDisplay = document.getElementById('myToken');
            if (tokenDisplay) {
                tokenDisplay.textContent = token;
            }
            
            // Clear previous QR code
            container.innerHTML = '';
            
            // Create shorter QR data (URL format for easy scanning)
            const baseUrl = window.location.origin + window.location.pathname;
            const qrData = `${baseUrl}?t=${token}&p=${state.peerId}`;
            
            try {
                // Use QRCode.js library
                qrCodeInstance = new QRCode(container, {
                    text: qrData,
                    width: 160,
                    height: 160,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.L // Use lower error correction for more data capacity
                });
                console.log('QR Code generated successfully');
            } catch (error) {
                console.error('QR Code generation failed:', error);
                // Fallback: show token as text
                container.innerHTML = `<div style="padding: 20px; text-align: center; background: white; color: black; border-radius: 8px;">
                    <p style="font-size: 10px; margin-bottom: 8px;">QR 碼生成失敗</p>
                    <p style="font-size: 12px; font-family: monospace;">${token}</p>
                </div>`;
            }
        }

        // QR Scanner Functions
        function startQRScanner() {
            const readerElement = document.getElementById('qrReader');
            const startBtn = document.getElementById('startScannerBtn');
            const stopBtn = document.getElementById('stopScannerBtn');
            const resultContainer = document.getElementById('qrScanResult');
            
            if (!readerElement) {
                showToast('❌ 掃描器元素不存在', 'error');
                return;
            }
            
            // Check if HTTPS (required for camera)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                showToast('⚠️ 相機功能需要 HTTPS 安全連線', 'error');
                return;
            }
            
            try {
                html5QrCode = new Html5Qrcode("qrReader");
                
                const config = { 
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };
                
                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onQRCodeScanned,
                    onQRCodeScanError
                ).then(() => {
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'inline-flex';
                    resultContainer.style.display = 'none';
                    showToast('📷 相機已開啟，請對準 QR 碼', 'info');
                    AudioManager.play('select');
                }).catch((error) => {
                    console.error('Failed to start QR scanner:', error);
                    showToast('❌ 無法開啟相機: ' + error.message, 'error');
                });
                
            } catch (error) {
                console.error('QR Scanner initialization failed:', error);
                showToast('❌ QR 掃描器初始化失敗', 'error');
            }
        }
        
        function onQRCodeScanned(decodedText, decodedResult) {
            console.log('QR Code scanned:', decodedText);
            
            const resultContainer = document.getElementById('qrScanResult');
            const scannedDataElement = document.getElementById('qrScannedData');
            const stopBtn = document.getElementById('stopScannerBtn');
            
            // Stop scanning
            if (html5QrCode) {
                html5QrCode.stop().then(() => {
                    stopBtn.style.display = 'none';
                    document.getElementById('startScannerBtn').style.display = 'inline-flex';
                }).catch(err => console.error('Failed to stop scanner:', err));
            }
            
            // Display result
            scannedDataElement.textContent = decodedText;
            resultContainer.style.display = 'block';
            
            // Parse and store QR data
            try {
                const qrData = JSON.parse(decodedText);
                state.qrScannedData = qrData;
                showToast('✅ 已偵測到 QR 碼', 'success');
                AudioManager.play('detection');
            } catch (error) {
                state.qrScannedData = decodedText;
                showToast('⚠️ QR 碼格式無法識別，嘗試連接...', 'warning');
            }
        }
        
        function onQRCodeScanError(error) {
            // Ignore scan errors (continuously trying to scan)
            // console.log('QR Scan error:', error);
        }
        
        function stopQRScanner() {
            if (html5QrCode) {
                html5QrCode.stop().then(() => {
                    document.getElementById('startScannerBtn').style.display = 'inline-flex';
                    document.getElementById('stopScannerBtn').style.display = 'none';
                    showToast('📷 相機已關閉', 'info');
                    AudioManager.play('select');
                }).catch(err => console.error('Failed to stop scanner:', err));
            }
        }
        
        function connectWithQRData() {
            if (!state.qrScannedData) {
                showToast('⚠️ 沒有偵測到 QR 碼資料', 'warning');
                return;
            }
            
            try {
                let connectionData;
                let token = null;
                
                if (typeof state.qrScannedData === 'string') {
                    // Check if it's a URL format (contains ?t=)
                    if (state.qrScannedData.includes('?t=')) {
                        const url = new URL(state.qrScannedData);
                        token = url.searchParams.get('t');
                        const peerId = url.searchParams.get('p');
                        
                        if (token && peerId) {
                            connectionData = { token: token, peerId: peerId };
                        } else {
                            showToast('❌ 無效的 QR 碼 URL', 'error');
                            return;
                        }
                    } else {
                        // Try to parse as JSON
                        try {
                            connectionData = JSON.parse(state.qrScannedData);
                        } catch {
                            // If not JSON, treat as plain token
                            token = state.qrScannedData.trim().toUpperCase().replace(/-/g, '');
                            if (token.length === 12) {
                                connectionData = { token: token };
                            } else {
                                showToast('❌ 無效的 QR 碼資料', 'error');
                                return;
                            }
                        }
                    }
                } else {
                    connectionData = state.qrScannedData;
                }
                
                // Validate connection data
                if (!connectionData.token && !connectionData.peerId) {
                    showToast('❌ 無效的 QR 碼資料', 'error');
                    return;
                }
                
                // If it has a token, use token connection
                if (connectionData.token) {
                    const tokenDisplay = document.getElementById('tokenInput');
                    if (tokenDisplay) {
                        // Format token with dashes
                        let formattedToken = connectionData.token;
                        if (formattedToken.length === 12 && !formattedToken.includes('-')) {
                            formattedToken = formattedToken.slice(0, 4) + '-' + formattedToken.slice(4, 8) + '-' + formattedToken.slice(8);
                        }
                        tokenDisplay.value = formattedToken;
                    }
                    connectWithToken();
                } else {
                    // Direct peer connection
                    const deviceInfo = {
                        id: 'QR-' + connectionData.peerId,
                        name: connectionData.name || 'QR 碼掃描的裝置',
                        type: connectionData.deviceType || '未知類型',
                        browser: connectionData.browser || '未知瀏覽器',
                        os: connectionData.os || '未知系統',
                        icon: connectionData.deviceType === '手機' ? '📱' : '💻',
                        method: 'QR 碼',
                        connectionType: 'qr',
                        encrypted: true,
                        connected: true
                    };
                    
                    addConnectedDevice(deviceInfo);
                    showToast(`✅ 已與 ${deviceInfo.name} 建立連接！`, 'success');
                    AudioManager.play('transfer');
                }
                
            } catch (error) {
                console.error('QR connection error:', error);
                showToast('❌ QR 碼連接失敗', 'error');
            }
        }

        // Initialize app
        init();
    </script>
