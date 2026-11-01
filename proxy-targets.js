// Các nguồn không cho trình duyệt gọi trực tiếp (thiếu CORS), được chuyển tiếp qua /proxy/<tên>/...
// Dùng chung cho proxy của Vite (vite.config.js) và Cloudflare Pages Functions (functions/proxy).
export const PROXY_TARGETS = {
  lobsters: 'https://lobste.rs',
  github: 'https://github.com',
  thn: 'https://feeds.feedburner.com',
  bleeping: 'https://www.bleepingcomputer.com',
  krebs: 'https://krebsonsecurity.com',
};
