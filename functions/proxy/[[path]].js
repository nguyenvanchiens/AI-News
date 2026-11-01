import { PROXY_TARGETS } from '../../proxy-targets.js';

// Cloudflare Pages Function thay cho proxy của Vite khi chạy thật: /proxy/<tên>/<đường dẫn>.
// Chỉ chuyển tiếp tới các nguồn trong PROXY_TARGETS, không phải proxy mở.
export async function onRequestGet({ request, params }) {
  const name = params.path?.[0];
  const base = PROXY_TARGETS[name];
  if (!base) return new Response('Không có nguồn này', { status: 404 });

  const url = new URL(request.url);
  // Lấy từ pathname để giữ nguyên dấu "/" cuối và ký tự đã mã hóa (ví dụ c%2B%2B).
  const rest = url.pathname.slice(`/proxy/${name}`.length);
  const upstream = await fetch(`${base}${rest}${url.search}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MachAI/1.0)', Accept: request.headers.get('Accept') || '*/*' },
    cf: { cacheTtl: 600, cacheEverything: true },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
