const puppeteer = require("puppeteer");
const readline = require("readline");

// Ngăn trình duyệt lấy proxy từ biến môi trường/hệ thống
try {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.ALL_PROXY;
    delete process.env.NO_PROXY;
} catch (_) { }

// Hàm nhập dữ liệu từ terminal
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

// Hàm random số trong khoảng min-max
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random User-Agent
function getRandomUserAgent() {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getRandomProxy(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}

// Chỉ giữ form
const EVENT_TYPES = ["form"];

(async () => {
    // Nhập thông tin từ người dùng
    const TARGET_URL = await askQuestion("Nhập URL trang: ");
    const NUM_BOTS = parseInt(await askQuestion("Nhập số lượng bot: "), 10);
    const INTERVAL = parseInt(await askQuestion("Nhập interval (giây): "), 10) * 1000;
    const USE_PROXY = (await askQuestion("Dùng proxy trong danh sách? (y/N): ")).trim().toLowerCase().startsWith("y");

    const PROXY_LIST = [
        'socks5://5.78.99.142:10638',
        'socks5://5.78.99.142:10639',
        'socks5://5.78.99.142:10640',
        'socks5://5.78.99.142:10641',
        'socks5://5.78.99.142:10642',
        'socks5://5.78.99.142:10643',
        'socks5://5.78.99.142:10644',
        'socks5://5.78.99.142:10645',
        'socks5://5.78.99.142:10646',
        'socks5://5.78.99.142:10647',
        'socks5://5.78.99.142:10648',
        'socks5://5.78.99.142:10649',
        'socks5://5.78.99.142:10650',
        'socks5://5.78.99.142:10651',
        'socks5://5.78.99.142:10652',
        'socks5://5.78.99.142:10653',
        'socks5://5.78.99.142:10654',
        'socks5://5.78.99.142:10655',
        'socks5://5.78.99.142:10656',
        'socks5://5.78.99.142:10657'
    ];

    const activeBrowsers = [];
    const activeIntervals = [];

    async function createBot(botIndex, initialProxy) {
        let browser = null;
        let page = null;
        let proxy = initialProxy;
        let userAgent = '';
        let viewport = null;

        // thử tối đa 3 proxy khác nhau
        for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0 || !proxy) {
                proxy = USE_PROXY ? getRandomProxy(PROXY_LIST) : null;
            }

            const launchArgs = proxy
                ? [`--proxy-server=${proxy}`]
                : [
                    "--no-proxy-server",
                    "--proxy-bypass-list=*",
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ];

            try {
                browser = await puppeteer.launch({ headless: false, args: launchArgs });
                page = await browser.newPage();

                // Optional proxy authentication
                try {
                    if (proxy && proxy.includes('@')) {
                        const afterScheme = proxy.split('://')[1] || "";
                        const credPart = afterScheme.split('@')[0];
                        const [username, password] = credPart.split(':');
                        if (username && password) {
                            await page.authenticate({ username, password });
                        }
                    }
                } catch (_) { }

                // Hardening + random UA/viewport
                userAgent = getRandomUserAgent();
                await page.setUserAgent(userAgent);
                viewport = { width: randomBetween(1200, 1680), height: randomBetween(700, 950) };
                await page.setViewport(viewport);
                page.setDefaultNavigationTimeout(60000);
                page.setDefaultTimeout(30000);

                console.log(`Bot #${botIndex} dùng proxy: ${proxy || 'none'} | UA: ${userAgent}`);
                console.log(`Bot #${botIndex} đang truy cập ${TARGET_URL}`);

                await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

                // nếu tới đây là thành công
                activeBrowsers.push(browser);
                break;
            } catch (err) {
                try { if (page) await page.close(); } catch (_) { }
                try { if (browser) await browser.close(); } catch (_) { }
                browser = null; page = null;
                if (attempt === 2) {
                    console.error(`Bot #${botIndex} không thể kết nối qua proxy sau 3 lần thử.`);
                    return;
                }
            }
        }

        async function interact() {
            try {
                // chỉ form
                const forms = await page.$$("form");
                if (forms.length > 0) {
                    const form = forms[Math.floor(Math.random() * forms.length)];
                    const inputs = await form.$$("input, textarea");

                    for (const input of inputs) {
                        const type = await input.evaluate(i => i.type);
                        const name = await input.evaluate(i => i.name || i.id || "");

                        if (type === "email") {
                            await input.type(`bot${botIndex}@test.com`);
                        } else if (type === "number" || /phone|mobile|sdt/i.test(name)) {
                            const phone = "09" + Math.floor(10000000 + Math.random() * 90000000).toString();
                            await input.type(phone);
                        } else {
                            await input.type(`Test${botIndex}`);
                        }
                    }

                    const submit = await form.$('[type="submit"]') || await form.$("button");

                    if (submit) {
                        await Promise.all([
                            page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
                            submit.click()
                        ]);
                        console.log(`Bot #${botIndex} submit form`);

                        // quay lại trang gốc
                        await page.goto(TARGET_URL, { waitUntil: "networkidle2" });
                    }
                }
            } catch (err) {
                console.error(`Bot #${botIndex} lỗi:`, err);
            }
        }

        // chạy ngay lần đầu, sau đó theo interval
        await interact();
        const intervalId = setInterval(interact, INTERVAL);
        activeIntervals.push(intervalId);
    }

    // Preflight: liệt kê chi tiết form
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-proxy-server",
                "--proxy-bypass-list=*",
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        });
        const page = await browser.newPage();
        await page.setUserAgent(getRandomUserAgent());
        await page.setViewport({ width: 1366, height: 800 });
        await page.goto(TARGET_URL, { waitUntil: "networkidle2" });
        const formCount = await page.$$eval('form', els => els.length).catch(() => 0);
        console.log(`Event khả dụng: form=${formCount}`);
        await browser.close();
    } catch (_) { }

    // Chạy các bot
    for (let i = 0; i < NUM_BOTS; i++) {
        const proxy = USE_PROXY && PROXY_LIST.length > 0
            ? PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)]
            : null;
        createBot(i + 1, proxy);
    }

    let isShuttingDown = false;

    async function shutdown(reason) {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log('\n🛑 Đang dừng tất cả bot...');
        try {
            for (const id of activeIntervals) {
                clearInterval(id);
            }
            for (const browser of activeBrowsers) {
                try { await browser.close(); } catch (_) { }
            }
        } finally {
            console.log(`✅ Đã đóng tất cả bot (${activeBrowsers.length}). Lý do: ${reason}`);
        }
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
        console.error('⚠️  Lỗi chưa bắt:', err && err.stack ? err.stack : err);
        shutdown('uncaughtException');
    });
})();
