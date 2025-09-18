import fetch from "node-fetch";

const URL = "https://getdataga4.onrender.com/"; // thay bằng link của bạn
const INTERVAL = 1000 * 60 * 5; // ping mỗi 5 phút

async function ping() {
  try {
    const res = await fetch(URL);
    console.log(`[${new Date().toISOString()}] Ping status: ${res.status}`);
  } catch (err) {
    console.error("Ping error:", err.message);
  }
}

// chạy ngay 1 lần rồi lặp theo interval
ping();
setInterval(ping, INTERVAL);
