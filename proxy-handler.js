import { PROXY_TARGETS } from './proxy-targets.js';

// Chuyển tiếp /proxy/<tên>/<đường dẫn> tới nguồn tương ứng trong PROXY_TARGETS (không phải proxy mở).
// Dùng chung cho Cloudflare Workers (worker/index.js) và Cloudflare Pages (functions/proxy).
export async function handleProxy(request) {
  if (request.method !== 'GET') return new Response('Chỉ hỗ trợ GET', { status: 405 });

  const url = new URL(request.url);
  const name = url.pathname.split('/')[2];
  const base = PROXY_TARGETS[name];
  if (!base) return new Response('Không có nguồn này', { status: 404 });

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
      // App dùng header này để biết proxy đang chạy (không thì nhận nhầm trang index.html).
      'X-Mach-Proxy': '1',
    },
  });
}
