const puppeteer = require("puppeteer");

(async () => {
  const TARGET_URL = process.argv[2];
  const MEASUREMENT_ID = process.argv[3] || "G-1CQCE0SD00"; // Measurement ID

  if (!TARGET_URL) {
    console.error("❌ Vui lòng chạy: node event-checker.js <URL> <GA4_MEASUREMENT_ID>");
    process.exit(1);
  }

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

  console.log(`🔍 Đang quét: ${TARGET_URL}`);
  console.log(`📐 Measurement ID: ${MEASUREMENT_ID}`);
  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

  // ===== Quét element =====
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
    els.map(el => ({
      id: el.id || null,
      src: el.currentSrc || el.src || null
    }))
  );

  const sections = await page.$$eval("section, div[id], article", els =>
    els.map(el => ({
      id: el.id || null,
      className: el.className || null
    }))
  );

  const sliders = await page.$$eval("div, section", els =>
    els
      .filter(
        el =>
          /slider|carousel/i.test(el.className) ||
          el.getAttribute("role") === "slider"
      )
      .map(el => ({
        id: el.id || null,
        className: el.className || null
      }))
  );

  // ===== Checklist GTM =====
  let checklist = [];
  const customJsList = [];

  // FORM START + SUBMIT
  forms.forEach(f => {
    checklist.push({
      Tag: "GA4 – Form Start",
      Event: "form_start",
      Trigger: "Custom Event: form_start",
      Variables: "form_id, form_action, form_method",
      Measurement_ID: MEASUREMENT_ID,
      Selector: f.id ? `#${f.id}` : f.action || "form",
      "Custom JS": "Có"
    });

    checklist.push({
      Tag: "GA4 – Form Submit",
      Event: "form_submit",
      Trigger: "Custom Event: form_submit",
      Variables: "form_id, form_action, form_method",
      Measurement_ID: MEASUREMENT_ID,
      Selector: f.id ? `#${f.id}` : f.action || "form",
      "Custom JS": "Không"
    });

    customJsList.push({
      title: "Form Start",
      code: `
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
});
</script>`
    });
  });

  // BUTTON
  buttons.forEach(b => {
    checklist.push({
      Tag: "GA4 – Button Click",
      Event: "button_click",
      Trigger: "Custom Event: button_click",
      Variables: "button_id, button_text, button_class",
      Measurement_ID: MEASUREMENT_ID,
      Selector: b.id ? `#${b.id}` : b.text || "button",
      "Custom JS": "Không"
    });
  });

  // VIDEO
  if (videos.length > 0) {
    checklist.push({
      Tag: "GA4 – Video Tracking",
      Event: "video_event",
      Trigger: "Custom Event: video_event",
      Variables: "video_action, video_progress, video_url, video_duration",
      Measurement_ID: MEASUREMENT_ID,
      Selector: "Tất cả <video>",
      "Custom JS": "Có"
    });
    customJsList.push({
      title: "Video Tracking",
      code: `
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
</script>`
    });
  }

  // SECTION
  if (sections.length > 0) {
    checklist.push({
      Tag: "GA4 – Section Dwell Time",
      Event: "section_dwell",
      Trigger: "Custom Event: section_dwell",
      Variables: "section_id, section_class, dwell_time",
      Measurement_ID: MEASUREMENT_ID,
      Selector: "Tất cả section/div/article có ID/class",
      "Custom JS": "Có"
    });
    customJsList.push({
      title: "Section Dwell Time",
      code: `
<script>
document.querySelectorAll("section, div[id], article").forEach(sec => {
  let visible = false;
  let entered = false;
  let enterTime = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !visible && !entered) {
        visible = true;
        enterTime = Date.now();
      } else if (!entry.isIntersecting && visible && !entered) {
        visible = false;
        const dwell = Math.round((Date.now() - enterTime) / 1000);
        dataLayer.push({
          event: "section_dwell",
          section_id: sec.id || null,
          section_class: sec.className || null,
          dwell_time: dwell
        });
        entered = true;
      }
    });
  }, { threshold: 0.5 });

  observer.observe(sec);
});
</script>`
    });
  }

  // RELOAD
  checklist.push({
    Tag: "GA4 – Reload Tracking",
    Event: "reload_event",
    Trigger: "Custom Event: reload_event",
    Variables: "reload_count, time_since_last",
    Measurement_ID: MEASUREMENT_ID,
    Selector: "N/A",
    "Custom JS": "Có"
  });
  customJsList.push({
    title: "Reload Tracking",
    code: `
<script>
(function() {
  const now = Date.now();
  let lastLoad = sessionStorage.getItem("last_load_time");
  let count = sessionStorage.getItem("reload_count") || 0;

  if (lastLoad) {
    const diff = Math.round((now - parseInt(lastLoad)) / 1000);
    count = parseInt(count) + 1;
    dataLayer.push({
      event: "reload_event",
      reload_count: count,
      time_since_last: diff
    });
  } else {
    count = 1;
    dataLayer.push({
      event: "reload_event",
      reload_count: count,
      time_since_last: null
    });
  }

  sessionStorage.setItem("reload_count", count);
  sessionStorage.setItem("last_load_time", now);
})();
</script>`
  });

  // SLIDER
  if (sliders.length > 0) {
    checklist.push({
      Tag: "GA4 – Slide Change",
      Event: "slide_event",
      Trigger: "Custom Event: slide_event",
      Variables: "slide_index, slide_id, slide_class",
      Measurement_ID: MEASUREMENT_ID,
      Selector: ".swiper hoặc carousel",
      "Custom JS": "Có"
    });
    customJsList.push({
      title: "Slide/Carousel Tracking",
      code: `
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
</script>`
    });
  }

  // ===== GỘP TRÙNG =====
  function groupByTagEventTrigger(data) {
    const grouped = {};
    data.forEach(item => {
      const key = item.Tag + "|" + item.Event + "|" + item.Trigger;
      if (!grouped[key]) {
        grouped[key] = { ...item, Selectors: [] };
      }
      grouped[key].Selectors.push(item.Selector);
    });
    return Object.values(grouped).map(g => ({
      Tag: g.Tag,
      Event: g.Event,
      Trigger: g.Trigger,
      Variables: g.Variables,
      Measurement_ID: g.Measurement_ID,
      Selectors: g.Selectors.join(" | "),
      "Custom JS": g["Custom JS"]
    }));
  }

  checklist = groupByTagEventTrigger(checklist);

  // ===== In bảng ra console =====
  console.log("\n📊 Checklist setup GTM (đã gộp):");
  console.table(checklist);

  if (customJsList.length > 0) {
    console.log("\n💻 Custom JS cần thêm vào site:");
    customJsList.forEach(js => {
      console.log(`\n▶ ${js.title}`);
      console.log(js.code);
    });
  }

  await browser.close();
})();
