const { spawn } = require('child_process');
const path = require('path');

// Số lượng bot chạy đồng thời
const NUM_BOTS = 7;

// Danh sách proxy thực tế (bạn cần thay thế bằng proxy thật)
const PROXY_LIST = [
    // Thêm proxy của bạn vào đây
    'http://5.78.99.142:10638',
    'http://5.78.99.142:10639',
    'http://5.78.99.142:10640',
    'http://5.78.99.142:10641',
    'http://5.78.99.142:10642',
    'http://5.78.99.142:10643',
    'http://5.78.99.142:10644',
    'http://5.78.99.142:10645',
    'http://5.78.99.142:10646',
    'http://5.78.99.142:10647',
    'http://5.78.99.142:10648',
    'http://5.78.99.142:10649',
    'http://5.78.99.142:10650',
    'http://5.78.99.142:10651',
    'http://5.78.99.142:10652',
    'http://5.78.99.142:10653',
    'http://5.78.99.142:10654',
    'http://5.78.99.142:10655',
    'http://5.78.99.142:10656',
    'http://5.78.99.142:10657'
];

// Hàm tạo delay ngẫu nhiên
function getRandomDelay() {
    return Math.floor(Math.random() * 30000) + 10000; // 10-40 giây
}

// Hàm chạy một bot instance
function runBotInstance(botId, proxy = null, targetUrl = null) {
    console.log(`🚀 Khởi động Bot #${botId}...`);
    
    const env = { ...process.env };
    if (proxy) {
        env.PROXY = proxy;
    }
    env.BOT_ID = botId;
    if (targetUrl) {
        env.TARGET_URL = targetUrl;
    }
    // Mỗi bot dùng riêng profile để tránh đụng session/cache
    const path = require('path');
    env.USER_DATA_DIR = env.USER_DATA_DIR || path.join(__dirname, `.bot-profile-${botId}`);
    // Cho phép cấu hình headless qua ENV (true/new/false)
    env.HEADLESS = env.HEADLESS || 'false';
    
    
    const botProcess = spawn('node', ['run.js'], {
        env: env,
        stdio: 'pipe'
    });
    
    botProcess.stdout.on('data', (data) => {
        console.log(`[Bot #${botId}] ${data.toString().trim()}`);
    });
    
    botProcess.stderr.on('data', (data) => {
        console.error(`[Bot #${botId} ERROR] ${data.toString().trim()}`);
    });
    
    botProcess.on('close', (code) => {
        console.log(`[Bot #${botId}] Đã dừng với mã thoát: ${code}`);
    });
    
    return botProcess;
}

// Hàm chính để chạy nhiều bot
async function runMultipleBots() {
    console.log(`🎯 Bắt đầu chạy ${NUM_BOTS} bot đồng thời...`);
    console.log(`📊 Mỗi bot sẽ có cấu hình khác nhau (User-Agent, Viewport, Proxy)`);
    console.log(`⏰ Các bot sẽ khởi động với delay ngẫu nhiên để tránh đồng bộ\n`);
    
    const botProcesses = [];
    
    for (let i = 1; i <= NUM_BOTS; i++) {
        // Chọn proxy ngẫu nhiên nếu có
        const proxy = PROXY_LIST.length > 0 ? PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)] : null;
        const targetUrl = process.env.TARGET_URL || null; // có thể set chung hoặc mỗi bot tự hỏi nếu không có
        
        // Delay ngẫu nhiên trước khi khởi động bot
        const delay = getRandomDelay();
        console.log(`⏳ Bot #${i} sẽ khởi động sau ${delay/1000} giây...`);
        
        setTimeout(() => {
            const botProcess = runBotInstance(i, proxy, targetUrl);
            botProcesses.push(botProcess);
        }, delay);
    }
    
    // Xử lý tín hiệu thoát
    process.on('SIGINT', () => {
        console.log('\n🛑 Nhận tín hiệu thoát, đang dừng tất cả bot...');
        botProcesses.forEach(process => {
            process.kill('SIGTERM');
        });
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Nhận tín hiệu dừng, đang dừng tất cả bot...');
        botProcesses.forEach(process => {
            process.kill('SIGTERM');
        });
        process.exit(0);
    });
}

// Chạy script
runMultipleBots().catch(console.error); 