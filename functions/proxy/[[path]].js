import { handleProxy } from '../../proxy-handler.js';

// Cloudflare Pages Function: /proxy/* (khi deploy dạng Pages).
export const onRequestGet = ({ request }) => handleProxy(request);
