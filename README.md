# Mạch AI

Bảng tin cá nhân cho lập trình viên: tin lập trình được bàn nhiều, repo mới nổi, lỗ hổng bảo mật vừa công bố, bài viết hay và những gì đáng chú ý trong AI.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
```

Không cần API key. Phần lớn nguồn được gọi thẳng từ trình duyệt; riêng GitHub Trending, Lobsters và RSS các trang tin bảo mật không cho phép điều đó (thiếu CORS) nên đi qua `/proxy/*`. Danh sách nguồn nằm trong `proxy-targets.js`, dùng chung cho:

- proxy của Vite khi chạy trên máy (`vite.config.js`);
- Cloudflare Pages Function khi chạy thật (`functions/proxy/[[path]].js`).

## Đưa lên Cloudflare Pages

Cách 1, nối với Git (tự build mỗi lần push): tạo project Pages từ repo, Build command `npm run build`, Build output directory `dist`. Cloudflare tự nhận thư mục `functions/`. Phiên bản Node lấy từ file `.node-version`.

Cách 2, đẩy từ máy:

```bash
npx wrangler login     # lần đầu
npm run deploy         # build rồi đẩy thư mục dist kèm functions
```

Chạy thử môi trường Cloudflare trên máy trước khi đẩy: `npm run cf:dev` (mở http://127.0.0.1:8788).

Lưu ý: dữ liệu lưu trên trình duyệt (Đã lưu, bộ lọc, bản dịch) gắn với từng tên miền, nên bản trên Cloudflare bắt đầu trống, không mang theo dữ liệu từ localhost.

## Các trang

| Trang | Nguồn | Nội dung |
| --- | --- | --- |
| Tổng quan | tất cả | Dải "Mạch 7 ngày" và tóm tắt từng nguồn |
| Tin tức | Hacker News, Lobsters | Tin nổi bật, Show HN, Ask HN, lọc theo chủ đề và thời gian |
| Bảo mật | The Hacker News, BleepingComputer, Krebs on Security, GitHub Advisories, NVD | Tin bảo mật; lỗ hổng trong thư viện theo hệ sinh thái (npm, PyPI…) và mức độ; CVE nghiêm trọng 7 ngày qua |
| Repo GitHub | GitHub Trending, GitHub Search API | Đang thịnh hành (giống GitHub Trending, gồm cả repo lớn); Mới nổi (repo mới tạo); Nổi tiếng nhất (nhiều sao nhất mọi thời đại) |
| Kho công cụ | GitHub Search API | Repo theo nhu cầu (làm video, giọng nói, phụ đề, tạo ảnh, tự host…) và ô tìm kiếm nhận cả tiếng Việt (tự dịch sang tiếng Anh trước khi tìm) |
| Kiếm tiền với AI | GitHub Search API | Mã nguồn theo hướng kiếm tiền: video ngắn, SEO, bán hàng online, SaaS, chatbot, tự động hóa, tìm khách hàng, bot giao dịch; mỗi hướng rủi ro có lưu ý riêng |
| Bài viết | DEV (dev.to) | Bài được yêu thích nhất tuần theo thẻ |
| LLM mới | OpenRouter Models API | LLM mới ra mắt kèm giá API, độ dài ngữ cảnh, mô hình mở trọng số; link dùng thử trên trang chat chính thức (Claude, ChatGPT, Gemini, DeepSeek…) |
| Mô hình mở | Hugging Face | Mô hình trending, lọc theo loại |
| Bài báo | Hugging Face Daily Papers | Bài báo kèm tóm tắt, link arXiv và mã nguồn |
| Đã lưu | localStorage | Các mục bạn đánh dấu |

## Cấu trúc

```
src/
  lib/sources.js     gọi API và chuẩn hóa về một dạng Item chung
  lib/cache.js       cache 15 phút (bộ nhớ + localStorage), dùng bản cũ khi lỗi
  lib/store.jsx      context: ô lọc, làm mới, đã lưu; hook useData, router theo hash
  components/        Sidebar, Topbar, ItemList, PulseStrip, Chips
  pages/             Overview và các trang nguồn
  styles.css         token màu (sáng/tối) và layout
vite.config.js       proxy cho các nguồn thiếu CORS
```

Thêm nguồn mới: viết một hàm `fetchXxx` trả về mảng Item trong `sources.js`, thêm vào `queries` và `SOURCES`, thêm màu `--c-xxx` trong `styles.css`, rồi tạo trang trong `pages/Feeds.jsx`. Nguồn RSS không có CORS thì thêm một dòng `forward(...)` trong `vite.config.js`.

## Nhãn chi phí của repo

Ở Kho công cụ và Repo GitHub, mỗi repo được gắn nhãn Miễn phí / Miễn phí, có tùy chọn trả phí / Cần dịch vụ trả phí / Chưa rõ. Nhãn được suy ra từ README (`src/lib/cost.js`): dấu hiệu chạy trên máy (offline, Ollama, tải checkpoint, cần GPU…), key của dịch vụ tính tiền (OpenAI, ElevenLabs, fal.ai…) và các từ như pricing, subscription. Đây là ước tính tự động, nên đọc thêm dòng "Dựa trên README" bên dưới nhãn. Khi sửa quy tắc, đổi `STORE_KEY` để bỏ kết quả cũ.

## Giới hạn

- GitHub Search: khoảng 10 lượt mỗi phút khi chưa đăng nhập. GitHub Advisories: 60 lượt mỗi giờ.
- NVD: khoảng 5 lượt mỗi 30 giây.

Cache 15 phút giúp tránh chạm các giới hạn này. Khi vượt giới hạn, app hiện dữ liệu đã lưu trước đó (nếu có) kèm nút "Thử lại".
