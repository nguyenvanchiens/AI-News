import { handleProxy } from '../proxy-handler.js';

// Cloudflare Worker (khi deploy dạng Workers): /proxy/* đi qua proxy, còn lại là file tĩnh trong dist.
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/proxy/')) return handleProxy(request);
    return env.ASSETS.fetch(request);
  },
};
