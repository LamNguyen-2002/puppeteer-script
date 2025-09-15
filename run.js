const { default: puppeteer } = require("puppeteer");

const FIVE_MINUTES = 0.5 * 60 * 1000;
const BASE_URL = 'https://demosgtm001.netlify.app/';
// const BASE_URL = 'https://sukien.minhtrithanh.com/';

// Danh sách proxy miễn phí (có thể thay thế bằng proxy trả phí để ổn định hơn)
const PROXY_LIST = [
    // Proxy miễn phí - có thể không ổn định
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

// Hàm lấy proxy ngẫu nhiên
function getRandomProxy() {
    // Ưu tiên proxy từ environment variable (từ multi-bot.js)
    if (process.env.PROXY) {
        return process.env.PROXY;
    }
    
    // Nếu không có, chọn ngẫu nhiên từ danh sách
    if (PROXY_LIST.length === 0) {
        return null; // Không sử dụng proxy nếu không có
    }
    return PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
}

// Hàm tạo User-Agent ngẫu nhiên
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

// Hàm tạo viewport ngẫu nhiên
function getRandomViewport() {
    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 },
        { width: 1280, height: 720 },
        { width: 2560, height: 1440 }
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
}

// ----- FB tracking helpers -----
function generateRandomFbclid(length = 60) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomFbp() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1e10);
  return `fb.1.${ts}.${rand}`;
}

async function setFbpCookie(page) {
  await page.setCookie({
    name: '_fbp',
    value: generateRandomFbp(),
    url: BASE_URL
  });
}

async function navigateWithTracking(page) {
  const fbclid = generateRandomFbclid();
  const urlWithParam = `${BASE_URL}?fbclid=${fbclid}`;
  await setFbpCookie(page);
  await page.goto(urlWithParam, { waitUntil: 'domcontentloaded' });
}

// ----- Định nghĩa các hành động có thể thực hiện -----

// Hành động 1: Click nút "Đăng ký ngay"
async function clickDangKyNgay(page) {
    console.log("Đang thực hiện: Click nút 'Đăng ký ngay'...");
    try {
        await page.waitForSelector('#btn-cta-primary', { timeout: 5000 });
        await page.click('#btn-cta-primary');
        console.log("=> Hoàn thành: Đã click nút 'Đăng ký ngay'.");
    } catch (error) {
        console.log("=> Lỗi: Không thể click nút 'Đăng ký ngay' -", error.message);
    }
}

// // Hành động 2: Click nút "Tư vấn miễn phí"
async function clickTuVanMienPhi(page) {
    console.log("Đang thực hiện: Click nút 'Tư vấn miễn phí'...");
    try {
        await page.waitForSelector('#btn-cta-secondary', { timeout: 5000 });
        await page.click('#btn-cta-secondary');
        console.log("=> Hoàn thành: Đã click nút 'Tư vấn miễn phí'.");
    } catch (error) {
        console.log("=> Lỗi: Không thể click nút 'Tư vấn miễn phí' -", error.message);
    }
}

// // Hành động 3: Điền và gửi form
async function submitForm(page) {
    console.log("Đang thực hiện: Điền và gửi form...");
    try {
        // Kiểm tra xem các element có tồn tại không
        const elements = await page.evaluate(() => {
            const formElements = {
                name: document.querySelector('#name'),
                email: document.querySelector('#email'),
                phone: document.querySelector('#phone'),
                note: document.querySelector('#note'),
                submit: document.querySelector('#btn-submit')
            };
            
            return {
                name: !!formElements.name,
                email: !!formElements.email,
                phone: !!formElements.phone,
                note: !!formElements.note,
                submit: !!formElements.submit
            };
        });
        
        console.log("Các element có sẵn:", elements);
        
        // Chỉ điền các field có sẵn
        if (elements.name) {
            await page.type('#name', 'Test User');
        }
        if (elements.email) {
            await page.type('#email', `testuser${Date.now()}@example.com`);
        }
        if (elements.phone) {
            await page.type('#phone', '0987654321');
        }
        if (elements.note) {
            await page.type('#note', 'Đây là một ghi chú tự động.');
        }

        // Thử click nút submit nếu có
        if (elements.submit) {
            await page.click('#btn-submit');
            console.log("=> Hoàn thành: Đã điền và gửi form.");
        } else {
            console.log("=> Hoàn thành: Đã điền form nhưng không tìm thấy nút submit.");
        }
    } catch (error) {
        console.log("=> Lỗi khi điền form:", error.message);
    }
}

// Hành động 4: Xem hết video
async function watchFullVideo(page) {
    console.log("Đang thực hiện: Xem video...");

    try {
        // Chờ video xuất hiện
        await page.waitForSelector('#promoVideo', { timeout: 10000 });

        // Đảm bảo video hiển thị trong viewport để tránh bị chặn autoplay
        const videoHandle = await page.$('#promoVideo');
        if (videoHandle && videoHandle.scrollIntoViewIfNeeded) {
            await videoHandle.scrollIntoViewIfNeeded();
        }

        // Chờ metadata sẵn sàng
        await page.$eval('#promoVideo', el => new Promise(resolve => {
            if (el.readyState >= 1) { // HAVE_METADATA
                resolve();
            } else {
                el.addEventListener('loadedmetadata', () => resolve(), { once: true });
            }
        }));
        
        // Lấy độ dài video (an toàn khi metadata có thể lỗi)
        const duration = await page.$eval('#promoVideo', el => {
            const d = Number(el.duration);
            if (!isFinite(d) || d <= 0) {
                return 0;
            }
            return d;
        });
        console.log(`=> Thời lượng video: ${duration.toFixed(2)} giây.`);
        
        // Play video, mute để chạy headless
        await page.$eval('#promoVideo', el => {
            el.muted = true; // Bắt buộc trong headless
            el.volume = 0;
            el.setAttribute('playsinline', '');
            el.setAttribute('webkit-playsinline', '');
            // Nỗ lực bật autoplay
            const playPromise = el.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => console.log('Play error:', err));
            }
        });

        console.log("=> Video đã bắt đầu phát.");

        // Xác thực video thực sự đang chạy (currentTime tăng và không paused)
        const started = await page.waitForFunction(() => {
            const v = document.querySelector('#promoVideo');
            if (!v) return false;
            return v.readyState >= 2 && v.currentTime > 0 && !v.paused;
        }, { timeout: 15000 }).catch(() => null);
        
        // Nếu chưa chạy, thử click lên video rồi play lại
        if (!started) {
            try {
                await page.click('#promoVideo');
                await page.$eval('#promoVideo', el => el.play().catch(() => {}));
            } catch {}
        }

        // Đợi video chạy hết
        const maxWaitMs = duration > 0 ? (duration + 5) * 1000 : 45000;
        await page.waitForFunction(() => {
            const v = document.querySelector('#promoVideo');
            return !!v && (v.ended === true || (v.currentTime > 0 && v.paused === true));
        }, { timeout: maxWaitMs });

        console.log("=> Hoàn thành: Đã xem hết video.");
    } catch (error) {
        console.log("=> Lỗi: Không thể xem hết video -", error.message);
    }
}

// Click button "Xem thêm"
async function clickXemThemInfo(page) {
    console.log("Đang thực hiện: Click nút 'Xem thêm' phần info...");
    try {
        await page.waitForSelector('#btn-more-info', { timeout: 5000 });
        await page.click('#btn-more-info');
        console.log("=> Hoàn thành: Đã click nút 'Xem thêm' phần info.");
    } catch (error) {
        console.log("=> Lỗi: Không thể click nút 'Xem thêm' phần info -", error.message);
    }
}

// Xem hết video
async function watchVideo(page) {
    console.log("Đang thực hiện: Xem video giới thiệu phần info...");
    try {
        await page.waitForSelector('#video_introduce', { timeout: 5000 });

        // Lấy độ dài video
        const duration = await page.$eval('#video_introduce', el => el.duration);

        // Play video
        await page.$eval('#video_introduce', el => el.play());
        console.log(`=> Video đã bắt đầu phát (thời lượng: ${duration.toFixed(2)} giây).`);

        // Đợi cho video chạy hết
        await page.waitForFunction(
            () => document.querySelector('#video_introduce').ended,
            { timeout: (duration + 2) * 1000 } // cộng thêm buffer 2s
        );

        console.log("=> Hoàn thành: Đã xem hết video phần info.");
    } catch (error) {
        console.log("=> Lỗi: Không thể xem hết video phần info -", error.message);
    }
}

// Điền form và submit 1
async function fillAndSubmitForm1(page) {
    console.log("Đang thực hiện: Điền form và submit phần 1...");
    try {
        // Điền Họ và tên
        await page.waitForSelector('#input_first_name-form1');
        await page.type('#input_first_name-form1', 'Nguyễn Văn A');

        // Điền số điện thoại
        await page.waitForSelector('#mobile_code');
        await page.type('#mobile_code', '0987654321');

        // Điền email
        await page.waitForSelector('#input_email-form1');
        await page.type('#input_email-form1', 'test@example.com');

        // Chọn vấn đề (ví dụ chọn "5" = Thiếu định hướng, không có mục tiêu)
        await page.waitForSelector('#problems-select');
        await page.select('#problems-select', '5');

        // Click Submit
        await page.waitForSelector('#btn-submit');
        await page.click('#btn-submit');

        console.log("=> Hoàn thành: Đã điền form và bấm Submit.");
    } catch (error) {
        console.log("=> Lỗi: Không thể submit form phần 1 -", error.message);
    }
}

// Điền form và submit 2
async function fillAndSubmitForm2(page) {
    console.log("Đang thực hiện: Điền form và submit phần 2...");
    try {
        // Điền Họ và tên
        await page.waitForSelector('#input_first_name-form2');
        await page.type('#input_first_name-form2', 'Nguyễn Văn A');

        // Điền số điện thoại
        await page.waitForSelector('#mobile_code_2');
        await page.type('#mobile_code_2', '0987654321');

        // Điền email
        await page.waitForSelector('#input_email-form2');
        await page.type('#input_email-form2', 'test@example.com');

        // Chọn vấn đề (ví dụ chọn "5" = Thiếu định hướng, không có mục tiêu)
        await page.waitForSelector('#problems-select_2');
        await page.select('#problems-select_2', '5');

        // Click Submit
        await page.waitForSelector('#btn-submit-2');
        await page.click('#btn-submit-2');

        console.log("=> Hoàn thành: Đã điền form và bấm Submit phần 2.");
    } catch (error) {
        console.log("=> Lỗi: Không thể submit form phần 2 -", error.message);
    }
}

// Xem video ngẫu nhiên event-info
async function watchRandomVideoEventInfo(page) {
    console.log("Đang thực hiện: Chọn ngẫu nhiên 1 video để xem phần event-info...");

    try {
        // Random số 1 → 3
        const randomIndex = Math.floor(Math.random() * 3) + 1;
        const playSelector = `#play_video_${randomIndex} img[src*="playvideo"]`;

        console.log(`=> Đã chọn slide số ${randomIndex} phần event-info`);

        // Click icon play
        await page.waitForSelector(playSelector, { timeout: 5000 });
        await page.click(playSelector);
        console.log("=> Đã click icon play video phần event-info.");

        // Giả sử sau khi click sẽ xuất hiện thẻ <video id="video_player">
        const videoSelector = "video"; // hoặc #video_player nếu trang có id cố định
        await page.waitForSelector(videoSelector, { timeout: 5000 });

        // Lấy độ dài video
        const duration = await page.$eval(videoSelector, el => el.duration);

        // Play video
        await page.$eval(videoSelector, el => el.play());
        console.log(`=> Video bắt đầu phát (thời lượng: ${duration.toFixed(2)} giây) phần event-info.`);

        // Đợi video chạy hết
        await page.waitForFunction(
            selector => document.querySelector(selector)?.ended === true,
            { timeout: (duration + 2) * 1000 }, // buffer thêm 2s
            videoSelector
        );

        console.log("=> Hoàn thành: Đã xem hết video phần event-info.");

    } catch (error) {
        console.log("=> Lỗi: Không thể xem video phần event-info -", error.message);
    }
}

// Mở ngẫu nhiên 1 buổi học
async function openRandomSession(page) {
    console.log("Đang thực hiện: Mở ngẫu nhiên 1 buổi học...");

    try {
        // Random buổi học 1-3
        const randomIndex = Math.floor(Math.random() * 3) + 1;
        const buttonSelector = `#btn-show-session-${randomIndex}`;
        const detailSelector = `.item-session:nth-child(${randomIndex}) .session-detail`;

        console.log(`=> Đã chọn Buổi ${randomIndex}`);

        // Click button để mở chi tiết
        await page.waitForSelector(buttonSelector, { timeout: 5000 });
        await page.click(buttonSelector);
        console.log(`=> Đã click nút "Buổi ${randomIndex}"`);

        // Chờ phần chi tiết hiển thị (class từ hidden -> hiện ra)
        await page.waitForFunction(
            (selector) => {
                const el = document.querySelector(selector);
                return el && getComputedStyle(el).display !== "none" && !el.classList.contains("hidden");
            },
            { timeout: 5000 },
            detailSelector
        );

        console.log(`=> Nội dung Buổi ${randomIndex} đã hiển thị.`);

        // Giả lập "đọc hết nội dung" bằng cách scroll đến cuối
        await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
        }, detailSelector);

        // Dừng lại vài giây để "giả lập đang đọc"
        await page.waitForTimeout(5000);

        console.log(`=> Hoàn thành: Đã đọc xong Buổi ${randomIndex}.`);

    } catch (error) {
        console.log("=> Lỗi: Không thể mở buổi học -", error.message);
    }
}

// Xem video ngẫu nhiên student-feelings
async function playRandomVideoStudentFeelings(page) {
    console.log("Đang thực hiện: Xem ngẫu nhiên 1 video trong slider phần student-feelings...");

    try {
        // Tổng số video (12 cái)
        const totalVideos = 12;

        // Random chọn video từ 1 đến 12
        const randomIndex = Math.floor(Math.random() * totalVideos) + 1;
        const videoSelector = `#video-${randomIndex}`;

        console.log(`=> Đã chọn video số ${randomIndex} phần student-feelings.`);

        // Chờ video xuất hiện trong DOM
        await page.waitForSelector(videoSelector, { timeout: 5000 });
        
        // Scroll đến video để đảm bảo nó hiển thị
        const videoElement = await page.$(videoSelector);
        await videoElement.scrollIntoViewIfNeeded();

        // Lấy duration (thời lượng video)
        const duration = await page.evaluate((selector) => {
            const video = document.querySelector(selector);
            return video ? video.duration : 0;
        }, videoSelector);

        // Bấm play video
        await page.evaluate((selector) => {
            const video = document.querySelector(selector);
            if (video) {
                video.play();
            }
        }, videoSelector);

        console.log(`=> Đang xem video số ${randomIndex}, thời lượng: ${duration} giây phần student-feelings.`);

        // Chờ xem hết video
        if (duration > 0) {
            await page.waitForTimeout(duration * 1000);
        } else {
            // Nếu không lấy được duration thì chờ 30 giây mặc định
            await page.waitForTimeout(30000);
        }

        console.log(`=> Hoàn thành: Đã xem xong video số ${randomIndex} phần student-feelings.`);

    } catch (error) {
        console.log("=> Lỗi: Không thể phát video phần student-feelings -", error.message);
    }
}

// Click nút 'Xem thêm' ngẫu nhiên student-feelings
async function clickRandomXemThemStudentFeelings(page) {
    console.log("Đang thực hiện: Click nút 'Xem thêm' phần student-feelings...");

    try {
        const totalSlides = 12; // tổng số slide
        const randomIndex = Math.floor(Math.random() * totalSlides);

        const buttonSelector = `#btn-view-more-feeling_${randomIndex}`;
        const videoSelector = `#video-${randomIndex + 1}`;

        // Đợi button xuất hiện
        await page.waitForSelector(buttonSelector, { timeout: 5000 });

        // Scroll đến button và click
        const buttonElement = await page.$(buttonSelector);
        await buttonElement.scrollIntoViewIfNeeded();
        await page.click(buttonSelector);

        console.log(`=> Đã click 'Xem thêm' của slide ${randomIndex + 1} phần student-feelings`);

        // Trả về video selector để function khác xử lý
        return videoSelector;

    } catch (error) {
        console.log("=> Lỗi khi click 'Xem thêm' phần student-feelings:", error.message);
        return null;
    }
}

// Điền form và submit 3
async function fillAndSubmitForm3(page) {
    console.log("Đang thực hiện: Điền form và submit phần 3...");
    try {
        // Điền Họ và tên
        await page.waitForSelector('#input_first_name-form3');
        await page.type('#input_first_name-form3', 'Nguyễn Văn A');

        // Điền số điện thoại
        await page.waitForSelector('#mobile_code_3');
        await page.type('#mobile_code_3', '0987654321');

        // Điền email
        await page.waitForSelector('#input_email-form3');
        await page.type('#input_email-form3', 'test@example.com');

        // Chọn vấn đề (ví dụ chọn "5" = Thiếu định hướng, không có mục tiêu)
        await page.waitForSelector('#problems-select_3');
        await page.select('#problems-select_3', '5');

        // Click Submit
        await page.waitForSelector('#btn-submit-3');
        await page.click('#btn-submit-3');

        console.log("=> Hoàn thành: Đã điền form và bấm Submit phần 3.");
    } catch (error) {
        console.log("=> Lỗi: Không thể submit form phần 3 -", error.message);
    }
}

// Click ngẫu nhiên nút "Xem thêm" trong phần tin tức
async function clickRandomXemThemEvent(page) {
    console.log("Đang thực hiện: Click 'Xem thêm' trong tin tức...");

    try {
        const totalEvents = 8; // Tổng số bài viết trong swiper
        const randomIndex = Math.floor(Math.random() * totalEvents);

        const buttonSelector = `#btn-view-more-event_${randomIndex}`;

        // Đợi nút xuất hiện
        await page.waitForSelector(buttonSelector, { timeout: 5000 });

        // Scroll tới nút
        const buttonElement = await page.$(buttonSelector);
        await buttonElement.scrollIntoViewIfNeeded();

        // Click nút
        await page.click(buttonSelector);

        console.log(`=> Đã click 'Xem thêm' tin tức số ${randomIndex + 1}`);

        return true;

    } catch (error) {
        console.log("=> Lỗi khi click 'Xem thêm' tin tức:", error.message);
        return false;
    }
}

// Hàm debug để xem tất cả các element có sẵn
async function debugPage(page) {
    console.log("=== DEBUG: Kiểm tra các element trên trang ===");
    const allElements = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
            id: btn.id,
            class: btn.className,
            text: btn.textContent.trim()
        }));
        
        const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
            id: input.id,
            name: input.name,
            type: input.type
        }));
        
        return { buttons, inputs };
    });
    
    console.log("Các button:", allElements.buttons);
    console.log("Các input:", allElements.inputs);
    console.log("=== KẾT THÚC DEBUG ===\n");
}

async function runBot() {
  console.log("Khởi động trình duyệt...");
  
  // Lấy proxy ngẫu nhiên
  const proxy = getRandomProxy();
  const userAgent = getRandomUserAgent();
  const viewport = getRandomViewport();
  
  console.log(`Sử dụng User-Agent: ${userAgent}`);
  console.log(`Viewport: ${viewport.width}x${viewport.height}`);
  if (proxy) {
    console.log(`Sử dụng proxy: ${proxy}`);
  } else {
    console.log("Không sử dụng proxy");
  }
  
  // Cấu hình browser với proxy và các tùy chọn khác
  const browserOptions = {
    headless: false,
    protocolTimeout: 180000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies',
      `--user-agent=${userAgent}`,
      `--window-size=${viewport.width},${viewport.height}`,
      '--proxy-bypass-list=*', // Bypass proxy nếu lỗi
      '--ignore-certificate-errors',
      '--ignore-ssl-errors'
    ]
  };
  
  // Thêm proxy nếu có
  if (proxy) {
    browserOptions.args.push(`--proxy-server=${proxy}`);
  }
  
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport(viewport);
  
  // Set User-Agent
  await page.setUserAgent(userAgent);
  
  // Tăng timeout mặc định để tránh lỗi Runtime.callFunctionOn timed out
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  
  // Thêm các header ngẫu nhiên để giống người dùng thật
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  });

  // Tải nội dung HTML trực tiếp vào trang với fbclid và _fbp ngẫu nhiên
  await navigateWithTracking(page);
  console.log("Trang đã được tải. Bắt đầu vòng lặp hành động...");

  // Debug trang để xem các element có sẵn
  await debugPage(page);

  // Danh sách các hành động có thể thực hiện
  const actions = [
    //   clickXemThemInfo,
    //   watchVideo,
    //   watchRandomVideoEventInfo,
    //   openRandomSession,
    //   playRandomVideoStudentFeelings,
    //   clickRandomXemThemStudentFeelings,
    //   fillAndSubmitForm1,
    //   fillAndSubmitForm2,
    //   fillAndSubmitForm3,
    //   clickRandomXemThemEvent
    clickDangKyNgay,
    clickTuVanMienPhi,
    submitForm,
    watchFullVideo
  ];

  // Vòng lặp vô hạn để thực hiện hành động
  while (true) {
      try {
          // Chọn một hành động ngẫu nhiên từ danh sách
          const randomIndex = Math.floor(Math.random() * actions.length);
          const selectedAction = actions[randomIndex];

          // Thực thi hành động đã chọn
          await selectedAction(page);
          
          // Sau khi submit form, trang có thể reset. Tải lại nội dung để đảm bảo các lần sau chạy đúng
        //   if (selectedAction === fillAndSubmitForm1 || selectedAction === fillAndSubmitForm2 || selectedAction === fillAndSubmitForm3) {
        //     await navigateWithTracking(page);
        //   }
            // if(selectedAction === clickRandomXemThemEvent || selectedAction === watchRandomVideoEventInfo || selectedAction === openRandomSession 
            //     || selectedAction === playRandomVideoStudentFeelings || selectedAction === clickRandomXemThemStudentFeelings) {
            //     await navigateWithTracking(page);
            // }
            if(selectedAction === submitForm || selectedAction === watchFullVideo) {
                await navigateWithTracking(page);
            }
          // Chờ 5 phút trước khi thực hiện hành động tiếp theo
          console.log(`\nHoàn tất hành động. Sẽ chờ 5 phút trước khi tiếp tục... (Thời gian hiện tại: ${new Date().toLocaleTimeString()})\n`);
          await new Promise(resolve => setTimeout(resolve, FIVE_MINUTES));

      } catch (error) {
          console.error("Đã xảy ra lỗi:", error);
          // Nếu có lỗi, có thể bạn muốn dừng script hoặc thử lại
          break;
      }
  }

  // Đóng trình duyệt (dòng này sẽ không được chạy trong vòng lặp vô hạn)
  await browser.close();
}

// Bắt đầu chạy bot
runBot();