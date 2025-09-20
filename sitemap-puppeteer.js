import fs from "fs";
import puppeteer from "puppeteer";

const START_URL = process.argv[2] || "https://minhtrithanh.com";
const MAX_DEPTH = 3;
const MAX_PAGES = 100;
const OUTPUT_FILE = "sitemap.xml";

const visited = new Set();
const toVisit = [{ url: START_URL, depth: 0 }];

async function crawl() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    while (toVisit.length > 0 && visited.size < MAX_PAGES) {
        const { url, depth } = toVisit.shift();
        if (visited.has(url) || depth > MAX_DEPTH) continue;

        try {
            await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
            visited.add(url);

            // Lấy toàn bộ link trên trang (sau khi JS render)
            const links = await page.$$eval("a[href]", els =>
                els.map(a => a.href).filter(h => h.startsWith("http"))
            );

            for (const link of links) {
                try {
                    const u = new URL(link);
                    const base = new URL(START_URL);
                    if (u.hostname === base.hostname && !visited.has(link)) {
                        toVisit.push({ url: link, depth: depth + 1 });
                    }
                } catch { }
            }
        } catch (e) {
            console.error("Error visiting", url, e.message);
        }
    }

    await browser.close();

    // Xuất sitemap.xml
    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const footer = `</urlset>`;
    let body = "";

    for (const u of visited) {
        const now = new Date().toISOString(); // mặc định dùng thời gian crawl làm lastmod
        body += `  <url>\n`;
        body += `    <loc>${u}</loc>\n`;
        body += `    <lastmod>${now}</lastmod>\n`;
        body += `    <changefreq>weekly</changefreq>\n`;   // có thể đổi: always, daily, weekly, monthly, yearly, never
        body += `    <priority>0.5</priority>\n`;          // 0.0 – 1.0 (trang chủ thường 1.0, còn lại 0.5)
        body += `  </url>\n`;
    }

    fs.writeFileSync(OUTPUT_FILE, header + body + footer, "utf8");
    console.log(`✅ Done. Found ${visited.size} URLs. Saved to ${OUTPUT_FILE}`);
}

crawl();
