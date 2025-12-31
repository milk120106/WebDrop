#!/usr/bin/env node
/**
 * WebDrop 流量監控腳本
 * 用於檢查流量使用量並在達到上限前發出警告或執行保護動作
 * 
 * 使用方式:
 *   node scripts/check-traffic.js [--warning 80] [--action 95]
 * 
 * 參數:
 *   --warning: 警告閾值百分比 (預設: 80)
 *   --action: 行動閾值百分比 (預設: 95)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
    // 流量上限 (GB) - GitHub Pages 免費方案限制
    monthlyBandwidthLimit: 100,
    
    // 每日請求上限
    dailyRequestLimit: 10000,
    
    // 警告閾值 (百分比)
    warningThreshold: parseFloat(process.argv.find(arg => arg.startsWith('--warning'))?.split('=')[1]) || 80,
    
    // 行動閾值 (百分比)
    actionThreshold: parseFloat(process.argv.find(arg => arg.startsWith('--action'))?.split('=')[1]) || 95,
    
    // 數據儲存位置
    dataFile: path.join(__dirname, '..', 'usage-data.json'),
    
    // GitHub API 設定
    github: {
        apiUrl: 'https://api.github.com',
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER || 'yourusername',
        repo: process.env.GITHUB_REPO || 'webdrop-project'
    },
    
    // 通知設定
    notification: {
        email: {
            enabled: !!process.env.GMAIL_USER,
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_APP_PASSWORD,
            to: process.env.NOTIFY_EMAIL || 'ivyhung151201@gmail.com'
        },
        telegram: {
            enabled: !!process.env.TELEGRAM_BOT_TOKEN,
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            chatId: process.env.TELEGRAM_CHAT_ID
        }
    }
};

// 使用數據結構
let usageData = {
    lastReset: new Date().toISOString(),
    dailyUsage: {},
    monthlyTotal: 0,
    alertsSent: 0,
    lastAlertType: null
};

/**
 * 載入使用數據
 */
function loadUsageData() {
    try {
        if (fs.existsSync(CONFIG.dataFile)) {
            const data = fs.readFileSync(CONFIG.dataFile, 'utf8');
            usageData = { ...usageData, ...JSON.parse(data) };
            console.log('📊 已載入使用數據');
        }
    } catch (error) {
        console.log('⚠️ 無法載入使用數據，使用初始值');
    }
}

/**
 * 儲存使用數據
 */
function saveUsageData() {
    try {
        fs.writeFileSync(CONFIG.dataFile, JSON.stringify(usageData, null, 2));
    } catch (error) {
        console.error('❌ 無法儲存使用數據:', error.message);
    }
}

/**
 * 檢查是否需要重置計數器
 */
function checkReset() {
    const now = new Date();
    const lastReset = new Date(usageData.lastReset);
    
    // 檢查是否為新月份
    if (now.getMonth() !== lastReset.getMonth()) {
        console.log('🔄 檢測到新月份，重置計數器');
        usageData.monthlyTotal = 0;
        usageData.dailyUsage = {};
        usageData.lastReset = new Date().toISOString();
        usageData.alertsSent = 0;
        usageData.lastAlertType = null;
        saveUsageData();
        return true;
    }
    
    // 檢查是否為新的一天
    const today = now.toDateString();
    if (!usageData.dailyUsage[today]) {
        usageData.dailyUsage = { [today]: 0 };
        saveUsageData();
    }
    
    return false;
}

/**
 * 模擬獲取流量數據（實際環境中應從 GitHub API 獲取）
 */
async function fetchTrafficData() {
    try {
        // 嘗試從 GitHub API 獲取流量數據
        if (CONFIG.github.token) {
            console.log('📡 正在從 GitHub API 獲取流量數據...');
            
            // 注意: 流量數據 API 需要額外權限，這裡使用模擬數據作為範例
            // 實際部署時可使用 GitHub Traffic API 或其他監控服務
        }
        
        // 模擬當前使用量 (實際環境中應真實計算)
        return {
            monthlyBandwidthGB: 85 + Math.random() * 5, // 模擬 85-90 GB
            dailyRequests: Math.floor(Math.random() * 5000) + 5000, // 模擬 5000-10000 次請求
            pageViews: Math.floor(Math.random() * 8000) + 8000
        };
    } catch (error) {
        console.error('❌ 無法獲取流量數據:', error.message);
        return null;
    }
}

/**
 * 計算使用百分比
 */
function calculateUsagePercent(used, limit) {
    return (used / limit) * 100;
}

/**
 * 決定行動
 */
function determineAction(usagePercent) {
    if (usagePercent >= CONFIG.actionThreshold) {
        return {
            type: 'shutdown',
            message: `流量使用量已達到 ${usagePercent.toFixed(2)}%，即將或已超過上限`,
            level: 'critical'
        };
    } else if (usagePercent >= CONFIG.warningThreshold) {
        return {
            type: 'warning',
            message: `流量使用量已達到 ${usagePercent.toFixed(2)}%，請留意後續使用情況`,
            level: 'warning'
        };
    } else {
        return {
            type: 'normal',
            message: `流量使用量正常，當前為 ${usagePercent.toFixed(2)}%`,
            level: 'info'
        };
    }
}

/**
 * 檢查是否已發送相同類型的警報
 */
function shouldSendAlert(alertType) {
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 小時冷卻期
    const oneDayAgo = Date.now() - cooldownPeriod;
    
    return usageData.lastAlertType !== alertType || 
           usageData.alertsSent === 0 ||
           new Date(usageData.lastReset).getTime() < oneDayAgo;
}

/**
 * 發送通知
 */
async function sendNotification(action, trafficData) {
    const message = `
═══════════════════════════════════════
🚀 WebDrop 流量監控通知
═══════════════════════════════════════

📊 當前狀態：
   • 流量使用量: ${trafficData.monthlyBandwidthGB.toFixed(2)} GB / ${CONFIG.monthlyBandwidthLimit} GB
   • 使用百分比: ${((trafficData.monthlyBandwidthGB / CONFIG.monthlyBandwidthLimit) * 100).toFixed(2)}%
   • 每日請求: ${trafficData.dailyRequests.toLocaleString()} 次
   • 頁面瀏覽: ${trafficData.pageViews.toLocaleString()} 次

⚡ 監控結果：
   ${action.message}

📋 建議行動：
${action.level === 'critical' ? `
   🚨 立即行動：
   • 網站已自動切換至維護模式
   • 檢查是否有異常流量
   • 考慮升級到付費方案
   • 或聯繫管理員處理
` : `
   ⚠️ 預防措施：
   • 持續監控流量使用趨勢
   • 檢查是否有異常訪問
   • 準備應對措施
   • 考慮優化資源使用
`}

───────────────────────────────────────
🕐 監控時間: ${new Date().toLocaleString('zh-TW')}
🔧 自動化系統: WebDrop Traffic Monitor v1.0
═══════════════════════════════════════
`;
    
    // 發送 Email 通知
    if (CONFIG.notification.email.enabled && action.level !== 'normal') {
        await sendEmailNotification(message);
    }
    
    // 發送 Telegram 通知
    if (CONFIG.notification.telegram.enabled && action.level !== 'normal') {
        await sendTelegramNotification(message);
    }
    
    // 更新警報狀態
    if (action.level !== 'normal') {
        usageData.lastAlertType = action.type;
        usageData.alertsSent++;
        saveUsageData();
    }
}

/**
 * 發送 Email 通知
 */
async function sendEmailNotification(message) {
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: CONFIG.notification.email.user,
                pass: CONFIG.notification.email.password
            }
        });
        
        const subject = action.level === 'critical' 
            ? '🚨 WebDrop 流量警告 - 立即行動 Required'
            : '⚠️ WebDrop 流量監控通知';
        
        await transporter.sendMail({
            from: 'WebDrop Monitor <ivyhung151201@gmail.com>',
            to: CONFIG.notification.email.to,
            subject: subject,
            text: message
        });
        
        console.log('✅ Email 通知已發送');
    } catch (error) {
        console.error('❌ Email 通知發送失敗:', error.message);
    }
}

/**
 * 發送 Telegram 通知
 */
async function sendTelegramNotification(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${CONFIG.notification.telegram.botToken}/sendMessage`, {
            chat_id: CONFIG.notification.telegram.chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        
        console.log('✅ Telegram 通知已發送');
    } catch (error) {
        console.error('❌ Telegram 通知發送失敗:', error.message);
    }
}

/**
 * 生成維護模式切換腳本
 */
function generateMaintenanceScript(action) {
    const script = `#!/bin/bash
# WebDrop 維護模式切換腳本
# 自動生成於 ${new Date().toISOString()}

echo "🔧 切換 WebDrop 到維護模式..."

# 備份當前 index.html
if [ ! -f "index.html.backup" ]; then
    cp index.html index.html.backup
    echo "✅ 已備份 index.html"
fi

# 替換為維護頁面
cp maintenance.html index.html
echo "✅ 已切換到維護模式"

# Git 提交
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add -A
git commit -m "🚨 自動維護模式: ${action.message}
- 流量使用量: ${trafficData.monthlyBandwidthGB.toFixed(2)} GB
- 時間: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
- 自動生成 by WebDrop Traffic Monitor"

git push origin main --force
echo "✅ 已推送到 GitHub"

# 發送通知
echo "📧 發送通知郵件..."
node scripts/send-notification.js --type "${action.type}"

echo "✨ 維護模式切換完成"
`;
    
    fs.writeFileSync(
        path.join(__dirname, 'switch-maintenance.sh'),
        script,
        { mode: 0o755 }
    );
    
    return script;
}

/**
 * 主程式
 */
async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   WebDrop 流量監控系統 v1.0          ║');
    console.log('╚══════════════════════════════════════╝\n');
    
    // 載入使用數據
    loadUsageData();
    
    // 檢查是否需要重置
    checkReset();
    
    // 獲取流量數據
    const trafficData = await fetchTrafficData();
    
    if (!trafficData) {
        console.log('❌ 無法獲取流量數據，監控終止');
        process.exit(1);
    }
    
    // 計算使用量
    const bandwidthPercent = calculateUsagePercent(
        trafficData.monthlyBandwidthGB,
        CONFIG.monthlyBandwidthLimit
    );
    
    console.log(`\n📊 流量統計:`);
    console.log(`   • 月流量: ${trafficData.monthlyBandwidthGB.toFixed(2)} GB / ${CONFIG.monthlyBandwidthLimit} GB`);
    console.log(`   • 使用率: ${bandwidthPercent.toFixed(2)}%`);
    console.log(`   • 每日請求: ${trafficData.dailyRequests.toLocaleString()} / ${CONFIG.dailyRequestLimit.toLocaleString()}`);
    
    // 決定行動
    const action = determineAction(bandwidthPercent);
    
    console.log(`\n⚡ 監控結果: ${action.message}`);
    
    // 檢查是否需要發送警報
    if (action.level !== 'normal' && shouldSendAlert(action.type)) {
        console.log('\n📨 準備發送通知...');
        await sendNotification(action, trafficData);
        
        // 如果是關閉模式，生成維護切換腳本
        if (action.type === 'shutdown') {
            console.log('\n🔧 生成維護模式切換腳本...');
            generateMaintenanceScript(action);
        }
    } else if (action.level !== 'normal') {
        console.log(`\n⏰ 警報冷卻中，跳過通知（已發送 ${usageData.alertsSent} 次警報）`);
    } else {
        console.log('\n✅ 使用量正常，無需採取行動');
    }
    
    // 更新計數器
    usageData.monthlyTotal = trafficData.monthlyBandwidthGB;
    const today = new Date().toDateString();
    usageData.dailyUsage[today] = trafficData.dailyRequests;
    saveUsageData();
    
    console.log('\n✨ 監控完成');
    process.exit(action.type === 'shutdown' ? 1 : 0);
}

// 執行主程式
main().catch(error => {
    console.error('❌ 監控腳本執行錯誤:', error);
    process.exit(1);
});
