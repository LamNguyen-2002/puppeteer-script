/**
 * bot-audit.js
 * - Random hành động: video / form / button
 * - HTML5 video: xem hết duration
 * - YouTube iframe: click play và xem hết (giả định 180s)
 * - Form: điền input + submit + quay lại trang
 * - Button: click random trong danh sách selector bạn nhập
 * - Proxy rotation, preflight scan, graceful shutdown
 *
 * Usage: node bot-audit.js
 */

const puppeteer = require("puppeteer");
const readline = require("readline");

// ---- CONFIG ----
const MAX_PROXY_ATTEMPTS = 3;
const DEFAULT_VIEWPORT = { width: 1366, height: 800 };
const HEADLESS = false;
// -----------------

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY"].forEach(k => { try { delete process.env[k]; } catch (_) { } });

function askQuestion(q) { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise(res => rl.question(q, a => { rl.close(); res(a); })); }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getRandomUserAgent() {
    return choose([
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ]);
}

async function getUniqueSelector(page, el) {
    return page.evaluate(el => {
        if (!el) return null;
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className ? '.' + el.className.toString().trim().replace(/\s+/g, '.') : '';
        const text = (el.innerText || el.textContent || '').trim().slice(0, 50);
        return `${tag}${id}${classes} -> "${text}"`;
    }, el).catch(() => null);
}

async function fillInput(input, idx) {
    try {
        const info = await input.evaluate(el => ({ type: el.type || null, name: el.name || el.id || null }));
        let val = "test";
        if (info.type === "email" || /email/i.test(info.name || "")) val = `bot${idx}@example.com`;
        else if (info.type === "tel" || /phone|sdt|mobile/i.test(info.name || "")) val = "09" + Math.floor(10000000 + Math.random() * 90000000);
        else if (info.type === "number") val = String(randomBetween(1, 9999));
        else if (info.type === "url") val = "https://example.com";
        else val = "bot_" + idx;
        await input.click({ clickCount: 3 }).catch(() => { });
        await input.type(val, { delay: 50 }).catch(() => { });
        return { name: info.name, value: val };
    } catch (_) { return null; }
}

async function simulateScroll(page, total = 10000) {
    const vh = page.viewport().height || DEFAULT_VIEWPORT.height;
    const ph = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    for (let i = 0; i < 8; i++) {
        const y = Math.min(ph - vh, Math.floor((i + 1) / 8 * (ph - vh)));
        await page.evaluate(_y => window.scrollTo(0, _y), y).catch(() => { });
        await sleep(randomBetween(400, 1000));
    }
    await sleep(1000);
}

async function attemptPlayYouTubeIframe(page, iframe) {
    try {
        const box = await iframe.boundingBox();
        if (!box) return false;
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
        await page.mouse.click(cx, cy, { delay: 100 });
        return true;
    } catch (_) { return false; }
}

async function interactCycle({ page, botIndex, TARGET_URL, log, CUSTOM_BUTTON_SELECTORS }) {
    await simulateScroll(page);
    const action = choose(["video", "form", "button"]);

    if (action === "video") {
        const vids = await page.$$("video");
        if (vids.length) {
            const v = choose(vids);
            const dur = await v.evaluate(el => isFinite(el.duration) ? el.duration : 30).catch(() => 30);
            await v.evaluate(el => { el.muted = true; el.play().catch(() => { }); });
            log(`Bot#${botIndex} xem hết HTML5 video ${dur}s`);
            await sleep(dur * 1000);
            return;
        }
        const iframes = await page.$$("iframe");
        for (const f of iframes) {
            const src = await f.evaluate(el => el.src).catch(() => null);
            if (src && /youtube/.test(src)) {
                try {
                    await attemptPlayYouTubeIframe(page, f);
                    const dur = 180;
                    log(`Bot#${botIndex} xem hết YouTube ${src} ${dur}s`);
                    await sleep(dur * 1000);
                } catch (err) {
                    log(`Bot#${botIndex} YouTube error: ${err.message}`);
                }
                return;
            }
        }
    }

    if (action === "form") {
        const forms = await page.$$("form");
        if (!forms.length) return;
        const form = choose(forms);
        const inputs = await form.$$("input,textarea,select");
        const filled = [];
        for (const inp of inputs) {
            const res = await fillInput(inp, botIndex);
            if (res) filled.push(res);
        }
        const submit = await form.$('[type="submit"],button');
        if (submit) await submit.click().catch(() => { });
        log(`Bot#${botIndex} submit form: ${JSON.stringify(filled)}`);
        await sleep(2000);
        await page.goto(TARGET_URL, { waitUntil: "networkidle2" }).catch(() => { });
        return;
    }

    if (action === "button") {
        let candidates = [];
        for (const sel of CUSTOM_BUTTON_SELECTORS) {
            const els = await page.$$(sel);
            candidates = candidates.concat(els);
        }
        if (!candidates.length) {
            log(`Bot#${botIndex} không tìm thấy element từ CUSTOM_BUTTON_SELECTORS`);
            return;
        }
        const el = choose(candidates);
        const selector = await getUniqueSelector(page, el); // lấy info trước
        try {
            await Promise.race([
                el.click(),
                page.waitForNavigation({ waitUntil: "networkidle2", timeout: 5000 }).catch(() => null)
            ]);
            log(`Bot#${botIndex} click custom button ${selector}`);
        } catch (err) {
            log(`Bot#${botIndex} button click error: ${err.message}`);
        }
        await sleep(randomBetween(800, 2000));
        return;
    }
}

// ---------- MAIN ----------
(async () => {
    const TARGET_URL = (await askQuestion("Nhập URL trang: ")).trim();
    const NUM_BOTS = parseInt(await askQuestion("Số lượng bot: "), 10) || 1;
    const INTERVAL = parseInt(await askQuestion("Interval (giây): "), 10) || 10;
    const USE_PROXY = (await askQuestion("Dùng proxy? (y/N): ")).toLowerCase().startsWith("y");
    const selectorsInput = (await askQuestion("Nhập CUSTOM_BUTTON_SELECTORS (cách nhau bằng dấu phẩy): ")).trim();
    const CUSTOM_BUTTON_SELECTORS = selectorsInput.split(",").map(s => s.trim()).filter(Boolean);

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

    function log(m) { console.log(new Date().toISOString(), m); }

    // Preflight scan
    try {
        const b = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        const p = await b.newPage();
        await p.setUserAgent(getRandomUserAgent());
        await p.setViewport(DEFAULT_VIEWPORT);
        await p.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 60000 });
        const counts = await p.evaluate(() => ({
            videos: document.querySelectorAll("video").length,
            iframes: Array.from(document.querySelectorAll("iframe")).map(i => i.src),
            forms: document.querySelectorAll("form").length,
            buttons: document.querySelectorAll("button").length
        }));
        log(`Preflight: videos=${counts.videos} iframes=${counts.iframes.length} forms=${counts.forms} buttons=${counts.buttons}`);
        await b.close();
    } catch (err) { log("Preflight failed: " + err.message); }

    const active = [];
    for (let i = 0; i < NUM_BOTS; i++) {
        (async (idx) => {
            let browser = null, page = null, proxy = null;
            for (let attempt = 0; attempt < MAX_PROXY_ATTEMPTS; attempt++) {
                if (USE_PROXY && PROXY_LIST.length) proxy = choose(PROXY_LIST);
                const args = proxy ? [`--proxy-server=${proxy}`, "--no-sandbox", "--disable-setuid-sandbox"] : ["--no-sandbox", "--disable-setuid-sandbox"];
                try {
                    browser = await puppeteer.launch({ headless: HEADLESS, args });
                    page = await browser.newPage();
                    await page.setUserAgent(getRandomUserAgent());
                    await page.setViewport({ width: randomBetween(1200, 1680), height: randomBetween(700, 1000) });
                    if (proxy && proxy.includes("@")) {
                        const [u, p] = proxy.split("://")[1].split("@")[0].split(":");
                        await page.authenticate({ username: u, password: p });
                    }
                    await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 60000 });
                    log(`Bot#${idx} launched (proxy=${proxy || "none"})`);
                    break;
                } catch (err) {
                    log(`Bot#${idx} launch fail ${attempt + 1}: ${err.message}`);
                    try { if (page) await page.close(); } catch (_) { }
                    try { if (browser) await browser.close(); } catch (_) { }
                    browser = null; page = null;
                }
            }
            if (!page) return;
            async function botLoop() {
                while (true) {
                    await interactCycle({ page, botIndex: idx, TARGET_URL, log, CUSTOM_BUTTON_SELECTORS });
                    const waitMs = randomBetween(INTERVAL * 500, INTERVAL * 1500); // 0.5x - 1.5x INTERVAL
                    await sleep(waitMs);
                }
            }
            botLoop(); // start loop
            active.push({ botIndex: idx, browser, page });
        })(i + 1);
        await sleep(500);
    }

    async function shutdown(reason) {
        log("Shutting down: " + reason);
        for (const a of active) {
            try { clearInterval(a.stopper); } catch (_) { }
            try { if (a.browser) await a.browser.close(); } catch (_) { }
        }
        process.exit(0);
    }
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("uncaughtException", err => { log("uncaught: " + err.message); shutdown("uncaughtException"); });
})();
