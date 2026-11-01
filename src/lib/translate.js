import { useEffect, useSyncExternalStore } from 'react';

// Dịch sang tiếng Việt qua Google Translate (không cần key). Các câu được gom lại
// rồi gửi một lần, kết quả lưu vào localStorage để lần sau không phải dịch lại.
const STORE_KEY = 'vi-cache';
const MAX_ENTRIES = 3000;
const MAX_CHARS = 4500;

let cache = load();
let version = 0;
const listeners = new Set();
const queue = new Set();
const inflight = new Set();
const failed = new Set();
let timer = null;
let saveTimer = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const entries = Object.entries(cache);
    if (entries.length > MAX_ENTRIES) cache = Object.fromEntries(entries.slice(-MAX_ENTRIES));
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cache));
    } catch {}
  }, 500);
}

function notify() {
  version++;
  listeners.forEach((l) => l());
}

const clean = (s) => s.replace(/\s+/g, ' ').trim();

async function translateBatch(texts) {
  const res = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t', {
    method: 'POST',
    body: new URLSearchParams({ q: texts.join('\n') }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const lines = data[0].map((seg) => seg[0]).join('').split('\n');
  if (lines.length !== texts.length) throw new Error('Số dòng dịch không khớp');
  return lines.map((l) => l.trim());
}

function chunk(texts) {
  const chunks = [];
  let cur = [];
  let len = 0;
  for (const t of texts) {
    if (cur.length && len + t.length > MAX_CHARS) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(t);
    len += t.length + 1;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

async function flush() {
  timer = null;
  const pending = [...queue];
  queue.clear();
  for (const part of chunk(pending)) {
    try {
      const out = await translateBatch(part);
      part.forEach((t, i) => (cache[t] = out[i]));
    } catch {
      // Không thử lại trong phiên này; mục đó giữ nguyên tiếng Anh.
      part.forEach((t) => failed.add(t));
    }
    part.forEach((t) => inflight.delete(t));
    notify();
  }
  persist();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Dịch câu tìm kiếm sang tiếng Anh để tìm trên GitHub. Câu đã là tiếng Anh thì giữ nguyên.
export async function toEnglish(text) {
  if (/^[\x00-\x7F]*$/.test(text)) return text;
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`,
  );
  if (!res.ok) return text;
  const data = await res.json();
  return data[0].map((seg) => seg[0]).join('').trim() || text;
}

export function cachedVi(text) {
  return text ? cache[clean(text)] : undefined;
}

// Trả về bản dịch nếu đã có, null nếu chưa (khi đó tự xếp hàng để dịch).
export function useVi(text, enabled) {
  const key = enabled && text ? clean(text) : '';
  useSyncExternalStore(subscribe, () => version);

  useEffect(() => {
    if (!key || key in cache || inflight.has(key) || failed.has(key)) return;
    inflight.add(key);
    queue.add(key);
    timer ??= setTimeout(flush, 60);
  }, [key]);

  return key ? (cache[key] ?? null) : null;
}
