# Puppeteer Bot Script

Script tự động tương tác với trang web để tạo traffic và tương tác người dùng.

## Tính năng

- ✅ Tự động click các nút trên trang web
- ✅ Điền và gửi form
- ✅ Thay đổi User-Agent ngẫu nhiên
- ✅ Thay đổi viewport ngẫu nhiên
- ✅ Hỗ trợ proxy để thay đổi IP
- ✅ Chạy nhiều bot đồng thời
- ✅ Delay ngẫu nhiên giữa các hành động

## Cài đặt

```bash
npm install
```

## Cách sử dụng

### 1. Chạy một bot đơn lẻ

```bash
node run.js
```

### 2. Chạy nhiều bot đồng thời (Khuyến nghị)

```bash
node multi-bot.js
```

## Cấu hình Proxy

Để thay đổi IP, bạn cần cấu hình proxy:

### Cách 1: Thêm proxy vào file `run.js`

```javascript
const PROXY_LIST = [
    'http://username:password@proxy1.com:8080',
    'http://username:password@proxy2.com:8080',
    'http://username:password@proxy3.com:8080'
];
```

### Cách 2: Thêm proxy vào file `multi-bot.js`

```javascript
const PROXY_LIST = [
    'http://username:password@proxy1.com:8080',
    'http://username:password@proxy2.com:8080',
    'http://username:password@proxy3.com:8080'
];
```

## Dịch vụ Proxy được khuyến nghị

### Proxy miễn phí (Không ổn định)
- [Free Proxy List](https://free-proxy-list.net/)
- [HideMyAss](https://www.hidemyass.com/proxy-list)

### Proxy trả phí (Ổn định)
- [Bright Data](https://brightdata.com/)
- [Oxylabs](https://oxylabs.io/)
- [SmartProxy](https://smartproxy.com/)
- [ProxyMesh](https://proxymesh.com/)

## Cấu hình nâng cao

### Thay đổi số lượng bot

Trong file `multi-bot.js`:
```javascript
const NUM_BOTS = 5; // Thay đổi số lượng bot
```

### Thay đổi thời gian chờ

Trong file `run.js`:
```javascript
const FIVE_MINUTES = 2 * 60 * 1000; // Thay đổi từ 5 phút thành 2 phút
```

### Thêm User-Agent mới

Trong file `run.js`:
```javascript
const userAgents = [
    // Thêm User-Agent mới vào đây
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];
```

## Lưu ý quan trọng

1. **Proxy miễn phí**: Có thể không ổn định và chậm
2. **Proxy trả phí**: Ổn định hơn nhưng tốn chi phí
3. **Tốc độ**: Không nên chạy quá nhiều bot cùng lúc để tránh bị phát hiện
4. **Tuân thủ**: Đảm bảo tuân thủ điều khoản sử dụng của trang web

## Troubleshooting

### Lỗi "Node is either not clickable or not an Element"
- Element có thể bị ẩn hoặc chưa load
- Script đã có error handling để xử lý

### Lỗi proxy
- Kiểm tra proxy có hoạt động không
- Thử proxy khác nếu proxy hiện tại không ổn định

### Bot bị dừng
- Kiểm tra console log để xem lỗi
- Đảm bảo trang web không thay đổi cấu trúc

## Cấu trúc file

```
puppeteer-script/
├── run.js          # Script bot đơn lẻ
├── multi-bot.js    # Script chạy nhiều bot
├── package.json    # Dependencies
└── README.md       # Hướng dẫn sử dụng
``` 