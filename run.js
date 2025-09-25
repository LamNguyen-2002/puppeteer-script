const { default: puppeteer } = require("puppeteer");

const WAIT_TIME = 0.5 * 60 * 1000; // 30s test
const BASE_URL = "https://phunutinhthuc.minhtrithanh.com";
const BOT_ID = process.env.BOT_ID || 1;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Scroll random %
async function smoothScrollRandom(page) {
    const percent = randomInt(30, 80);
    console.log(`👉 Bot sẽ cuộn ~${percent}% trang...`);

    await page.evaluate(async (targetPercent) => {
        const totalHeight = document.body.scrollHeight;
        const targetHeight = (totalHeight * targetPercent) / 100;
        let currentHeight = 0;
        const step = 200;

        while (currentHeight < targetHeight) {
            window.scrollBy(0, step);
            currentHeight += step;
            await new Promise((r) => setTimeout(r, 300));
        }
    }, percent);

    const pause = randomInt(3000, 10000);
    console.log(`⏸ Dừng đọc ${(pause / 1000).toFixed(1)}s...`);
    await new Promise((res) => setTimeout(res, pause));

    console.log(`✅ Đã cuộn đến ~${percent}% trang.`);
}

async function typeLikeHuman(page, selector, text) {
    const el = await page.$(selector);
    if (!el) return;
    await page.evaluate((el) => {
        el.style.outline = "3px solid red";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, el);
    for (const char of text) {
        await el.type(char, { delay: 150 });
    }
}

// --- Submit Form ---
async function submitForm(page, BOT_ID) {
    console.log(`📝 Bot #${BOT_ID} chuẩn bị điền form...`);
    try {
        // lấy random form
        const forms = await page.$$('[id^="input_first_name-form"]');
        if (forms.length === 0) {
            console.log("❌ Không tìm thấy form nào.");
            return;
        }
        const idx = Math.floor(Math.random() * forms.length);
        const firstNameSelector = await page.evaluate((el) => el.id, forms[idx]);
        const suffix = firstNameSelector.replace("input_first_name-form", "");

        const phoneSelector = "#mobile_code";
        const emailSelector = `#input_email-form${suffix}`;

        // điền dữ liệu
        await typeLikeHuman(page, `#${firstNameSelector}`, `Bot Tester ${BOT_ID}`);
        if (await page.$(phoneSelector)) {
            await typeLikeHuman(page, phoneSelector, `09${randomInt(10000000, 99999999)}`);
        }
        if (await page.$(emailSelector)) {
            await typeLikeHuman(page, emailSelector, `bot${BOT_ID}_${Date.now()}@example.com`);
        }

        // tìm nút submit theo text
        const btnHandle = await page.evaluateHandle(() => {
            const candidates = Array.from(document.querySelectorAll("#btn_submit span"));
            return candidates.find((el) =>
                el.textContent.toLowerCase().includes("gửi thông tin ngay")
            ) || null;
        });

        if (btnHandle) {
            await page.evaluate((el) => {
                el.style.outline = "3px solid blue";
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, btnHandle);
            await btnHandle.click();
            console.log(`✅ Bot #${BOT_ID} đã click "Gửi thông tin ngay".`);
        } else {
            console.log("❌ Không tìm thấy nút submit 'Gửi thông tin ngay'.");
        }

        await new Promise((res) => setTimeout(res, 5000));
        await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
        console.log(`🔄 Bot #${BOT_ID} reload lại trang.`);
    } catch (err) {
        console.log(`❌ Bot #${BOT_ID} lỗi khi submit form:`, err.message);
    }
}

// --- CTA ---
async function clickRandomButton(page) {
    console.log("🎯 Bot đang tìm CTA...");
    try {
        // tìm tất cả nút CTA có text
        const btnHandles = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll("span")).filter((el) => {
                const text = el.textContent.toLowerCase();
                return text.includes("đăng ký ngay") || text.includes("gửi thông tin ngay");
            });
        });

        const props = await btnHandles.getProperties();
        const buttons = [...props.values()].filter((v) => v.asElement);

        if (buttons.length === 0) {
            console.log("❌ Không có CTA.");
            return;
        }

        const idx = randomInt(0, buttons.length - 1);
        const button = buttons[idx];
        await page.evaluate((el) => {
            el.style.outline = "3px solid green";
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, button);
        await button.click();
        console.log(`✅ Click CTA random (#${idx + 1}).`);

        await new Promise((res) => setTimeout(res, 3000));
        await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    } catch (err) {
        console.log("❌ Lỗi CTA:", err.message);
    }
}

// --- Video ---
async function watchRandomVideo(page) {
    console.log("🎬 Bot đang tìm video...");

    try {
        const videos = await page.$$("video, iframe[src*='youtube.com/embed']");
        if (videos.length === 0) {
            console.log("❌ Không có video nào trên trang.");
            return;
        }

        const idx = randomInt(0, videos.length - 1);
        const videoHandle = videos[idx];
        console.log(`👉 Chọn video #${idx + 1}`);

        const tagName = await videoHandle.evaluate(el => el.tagName.toLowerCase());

        // ========================================
        // XỬ LÝ VIDEO HTML5 BÌNH THƯỜNG
        // ========================================
        if (tagName === "video") {
            await videoHandle.evaluate(el => {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.style.outline = "3px solid orange";
                el.muted = true;
            });

            // Play video
            await videoHandle.evaluate(el => el.play().catch(() => { }));

            // Check currentTime tăng
            const started = await page.waitForFunction(
                el => el.currentTime > 0 && !el.paused,
                { timeout: 5000 },
                videoHandle
            ).catch(() => null);

            if (started) {
                const duration = await videoHandle.evaluate(el => el.duration || 30);
                console.log(`▶️ Video thường đang phát, thời lượng ~${duration}s`);
                await new Promise(res => setTimeout(res, duration * 1000 + 2000));
                console.log("✅ Xem xong video thường.");
            } else {
                console.log("⚠️ Video thường không phát được.");
            }
        }

        // ========================================
        // XỬ LÝ VIDEO YOUTUBE (IFRAME)
        // ========================================
        if (tagName === "iframe") {
            await videoHandle.evaluate(el => {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.style.outline = "3px solid red";
            });

            const frame = await videoHandle.contentFrame();
            if (!frame) return console.log("❌ Không truy cập được iframe YouTube.");

            try {
                // 1. Click play button overlay
                const playButton = await frame.$(".ytp-large-play-button");
                if (playButton) {
                    await playButton.evaluate(btn => btn.click()); // ✅ chạy đúng context
                    console.log("▶️ Đã click nút Play trên YouTube overlay.");
                }

                // 2. Force mute + play trong iframe
                await frame.evaluate(() => {
                    const v = document.querySelector("video");
                    if (v) {
                        v.muted = true;
                        v.setAttribute("playsinline", "");
                        v.play().catch(() => { });
                    }
                });

                // 3. Check currentTime tăng
                const started = await frame.waitForFunction(() => {
                    const v = document.querySelector("video");
                    return v && v.currentTime > 0 && !v.paused;
                }, { timeout: 8000 }).catch(() => null);

                if (started) {
                    const duration = await frame.evaluate(() => {
                        const v = document.querySelector("video");
                        return v?.duration || 30;
                    });
                    console.log(`▶️ YouTube phát, thời lượng ~${duration}s`);

                    await new Promise(res => setTimeout(res, duration * 1000 + 2000));
                    console.log("✅ Xem xong YouTube.");
                } else {
                    console.log("⚠️ YouTube chưa phát, thử click trực tiếp...");
                    const vid = await frame.$("video");
                    if (vid) {
                        await vid.evaluate(v => v.click()); // ✅ đúng context
                        console.log("▶️ Đã click trực tiếp lên video.");
                    }
                }
            } catch (err) {
                console.log("❌ Lỗi khi phát YouTube:", err.message);
            }
        }

    } catch (err) {
        console.log("❌ Lỗi khi xem video:", err.message);
    }
}

// --- Run bot ---
async function runBot() {
    console.log(`🚀 Khởi động Bot #${BOT_ID}...`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    console.log("🌐 Đã vào trang:", BASE_URL);

    while (true) {
        try {
            await smoothScrollRandom(page);

            const choice = randomInt(1, 4); // thêm option video
            if (choice === 1) await submitForm(page, BOT_ID);
            else if (choice === 2) {
                console.log("🔄 Reload trang (không điền form).");
                await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
            } else if (choice === 3) await clickRandomButton(page);
            else if (choice === 4) await watchRandomVideo(page);

            console.log(`⏳ Hoàn tất vòng. Đợi 30s... (${new Date().toLocaleTimeString()})`);
            await new Promise((res) => setTimeout(res, WAIT_TIME));
        } catch (e) {
            console.error("❌ Lỗi vòng lặp:", e.message);
            break;
        }
    }

    await browser.close();
}

runBot();
