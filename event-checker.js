const fs = require("fs");
const puppeteer = require("puppeteer");

(async () => {
  const TARGET_URL = process.argv[2];
  const MEASUREMENT_ID = process.argv[3] || "G-XXXXXXX";
  const MODE = process.argv.includes("--audit") ? "audit" : "setup";

  if (!TARGET_URL) {
    console.error("❌ Vui lòng chạy: node event-checker.js <URL> <GA4_MEASUREMENT_ID> --setup|--audit");
    process.exit(1);
  }

  console.log(`🔍 Đang quét: ${TARGET_URL}`);
  console.log(`📐 Measurement ID: ${MEASUREMENT_ID}`);
  console.log(`⚙️ Mode: ${MODE}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36"
  );

  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

  // Chờ Nuxt mount
  await page.waitForFunction(() => !!window.$nuxt || !!window.__NUXT__, { timeout: 60000 });

  // =========================================================
  // =============== HÀM TIỆN ÍCH ============================
  // =========================================================
  function uniqueChecklist(checklist) {
    const seen = new Set();
    return checklist.filter(item => {
      const key = item.Event + "|" + item.Selector;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function groupByEvent(checklist) {
    const grouped = {};
    checklist.forEach(item => {
      if (!grouped[item.Event]) grouped[item.Event] = [];
      grouped[item.Event].push(item.Selector);
    });
    return Object.entries(grouped).map(([event, selectors]) => ({
      Event: event,
      Selector: selectors.join(" | ")
    }));
  }

  // =========================================================
  // =============== CUSTOM SNIPPETS =========================
  // =========================================================
  const snippets = {
    form: `
<script>
document.querySelectorAll("form").forEach(form => {
  let started = false;
  form.addEventListener("input", () => {
    if (!started) {
      started = true;
      dataLayer.push({
        event: "form_start",
        form_id: form.id || null,
        form_action: form.action || null,
        form_method: form.method || null
      });
    }
  });
  form.addEventListener("submit", () => {
    dataLayer.push({
      event: "form_submit",
      form_id: form.id || null,
      form_action: form.action || null,
      form_method: form.method || null
    });
  });
});
</script>
    `,
    button: `
<script>
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    dataLayer.push({
      event: "button_click",
      button_id: btn.id || null,
      button_text: (btn.innerText || btn.textContent || "").trim(),
      button_class: btn.className || null
    });
  });
});
</script>
    `,
    video: `
<script>
document.querySelectorAll("video").forEach(v => {
  let started = false;
  let completed = false;
  let checkpoints = {25: false, 50: false, 75: false};

  v.addEventListener("play", () => {
    if (!started) {
      dataLayer.push({
        event: "video_event",
        video_action: "start",
        video_url: v.currentSrc || v.src,
        video_duration: v.duration
      });
      started = true;
    }
  });

  v.addEventListener("timeupdate", () => {
    if (v.duration) {
      const percent = (v.currentTime / v.duration) * 100;
      [25, 50, 75].forEach(p => {
        if (!checkpoints[p] && percent >= p) {
          dataLayer.push({
            event: "video_event",
            video_action: "progress",
            video_progress: p,
            video_url: v.currentSrc || v.src,
            video_duration: v.duration
          });
          checkpoints[p] = true;
        }
      });
    }
  });

  v.addEventListener("ended", () => {
    if (!completed) {
      dataLayer.push({
        event: "video_event",
        video_action: "complete",
        video_url: v.currentSrc || v.src,
        video_duration: v.duration
      });
      completed = true;
    }
  });
});
</script>
    `,
    section: `
<script>
document.querySelectorAll("section, div[id], article").forEach(sec => {
  let visible = false;
  let enterTime = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        enterTime = Date.now();
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        const dwell = Math.round((Date.now() - enterTime) / 1000);
        dataLayer.push({
          event: "section_dwell",
          section_id: sec.id || null,
          section_class: sec.className || null,
          dwell_time: dwell
        });
      }
    });
  }, { threshold: 0.5 });

  observer.observe(sec);
});
</script>
    `,
    reload: `
<script>
(function() {
  const now = Date.now();
  let lastLoad = sessionStorage.getItem("last_load_time");
  let count = sessionStorage.getItem("reload_count") || 0;

  if (lastLoad) {
    const diff = Math.round((now - parseInt(lastLoad)) / 1000);
    count = parseInt(count) + 1;
    dataLayer.push({
      event: "reload_or_route_event",
      reload_count: count,
      time_since_last: diff
    });
  } else {
    count = 1;
    dataLayer.push({
      event: "reload_or_route_event",
      reload_count: count,
      time_since_last: null
    });
  }

  sessionStorage.setItem("reload_count", count);
  sessionStorage.setItem("last_load_time", now);

  // Theo dõi route change Nuxt SPA
  if (window.$nuxt && window.$nuxt.$router) {
    window.$nuxt.$router.afterEach((to, from) => {
      dataLayer.push({
        event: "nuxt_route_change",
        path: to.fullPath,
        from: from.fullPath
      });
    });
  }
})();
</script>
    `,
    slide: `
<script>
if (window.Swiper) {
  document.querySelectorAll('.swiper').forEach((slider) => {
    const swiper = slider.swiper;
    if (swiper) {
      swiper.on('slideChange', () => {
        dataLayer.push({
          event: 'slide_event',
          slide_index: swiper.activeIndex,
          slide_id: slider.id || null,
          slide_class: slider.className
        });
      });
    }
  });
}
</script>
    `
  };

  // =========================================================
  // =============== SETUP MODE ==============================
  // =========================================================
  if (MODE === "setup") {
    const forms = await page.$$eval("form", els =>
      els.map(el => ({ id: el.id || null, action: el.action || null }))
    );
    const buttons = await page.$$eval("button", els =>
      els.map(el => ({
        id: el.id || null,
        text: (el.innerText || el.textContent || "").trim().slice(0, 120)
      }))
    );
    const videos = await page.$$eval("video", els =>
      els.map(el => ({ id: el.id || null, src: el.currentSrc || el.src || null }))
    );
    const sections = await page.$$eval("section, div[id], article", els =>
      els.map(el => ({ id: el.id || null, className: el.className || null }))
    );

    // Tạo checklist
    let checklist = [];
    forms.forEach(f => {
      checklist.push({ Event: "form_start", Selector: f.id ? `#${f.id}` : "form" });
      checklist.push({ Event: "form_submit", Selector: f.id ? `#${f.id}` : "form" });
    });
    buttons.forEach(b => {
      const selector = b.id ? `#${b.id}` : (b.text || "button");
      checklist.push({ Event: "button_click", Selector: selector });
    });
    if (videos.length > 0) checklist.push({ Event: "video_event", Selector: "<video>" });
    if (sections.length > 0) checklist.push({ Event: "section_dwell", Selector: "section/div/article" });
    checklist.push({ Event: "reload_or_route_event", Selector: "N/A" });
    checklist.push({ Event: "nuxt_route_change", Selector: "router" });

    checklist = uniqueChecklist(checklist);
    checklist = groupByEvent(checklist);

    console.log("\n📊 Checklist (gọn):");
    console.table(checklist);

    fs.writeFileSync("gtm-container.json", JSON.stringify({ measurement_id: MEASUREMENT_ID, events: checklist }, null, 2));
    console.log("💾 Đã tạo file gtm-container.json");

    fs.writeFileSync(
      "custom-js-snippets.txt",
      [snippets.form, snippets.button, snippets.video, snippets.section, snippets.reload, snippets.slide].join("\n\n")
    );
    console.log("💾 Đã tạo file custom-js-snippets.txt (đầy đủ)");
  }

  // =========================================================
  // =============== AUDIT MODE ==============================
  // =========================================================
  if (MODE === "audit") {
    await page.exposeFunction("logEvent", e => {
      console.log("📩 DataLayer Event:", e);
    });
    await page.evaluate(() => {
      window.dataLayer = window.dataLayer || [];
      const orig = window.dataLayer.push;
      window.dataLayer.push = function () {
        window.logEvent(arguments[0]);
        return orig.apply(window.dataLayer, arguments);
      };
    });

    console.log("\n🧪 Đang test hành vi...");

    const btn = await page.$("button");
    if (btn) {
      await btn.click();
      console.log("✅ Click button test");
    }

    const form = await page.$("form input");
    if (form) {
      await form.type("test");
      await page.keyboard.press("Enter").catch(() => { });
      console.log("✅ Form test");
    }

    const video = await page.$("video");
    if (video) {
      await page.evaluate(() => {
        const v = document.querySelector("video");
        if (v) v.play();
      });
      console.log("✅ Video play test");
    }

    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    console.log("✅ Scroll test");

    // Test route change Nuxt
    await page.evaluate(() => {
      if (window.$nuxt && window.$nuxt.$router) {
        window.$nuxt.$router.push("/test-route");
      }
    });
    console.log("✅ Route change test");

    console.log("\n👉 Kiểm tra log ở trên để thấy event nào bắn ra (📩 DataLayer Event).");
  }

  await browser.close();
})();
