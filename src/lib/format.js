import { cachedVi } from './translate.js';

const rtf =new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

export function timeAgo(ms) {
  const diff = (ms - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
  return rtf.format(Math.round(diff / (86400 * 365)), 'year');
}

export function compact(n) {
  if (n == null) return '';
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1000).toFixed(n < 1e4 ? 1 : 0).replace('.0', '') + 'k';
  return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
}

// Tìm cả trong bản dịch tiếng Việt (nếu đã dịch) để gõ từ khóa tiếng Việt vẫn ra kết quả.
export function matches(item, q) {
  if (!q) return true;
  const hay = [
    item.title,
    cachedVi(item.title),
    item.summary,
    item.summary && cachedVi(item.summary.slice(0, 400)),
    item.author,
    item.domain,
    ...(item.tags || []),
  ]
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word));
}
