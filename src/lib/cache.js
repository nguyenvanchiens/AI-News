// Cache 2 tầng (bộ nhớ + localStorage) để chuyển trang tức thì và tránh vượt giới hạn API.
const TTL = 15 * 60 * 1000;
const memory = new Map();

function readStored(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = localStorage.getItem('cache:' + key);
    if (raw) {
      const entry = JSON.parse(raw);
      memory.set(key, entry);
      return entry;
    }
  } catch {}
  return null;
}

export async function cached(key, fetcher, { force = false } = {}) {
  const entry = readStored(key);
  if (!force && entry && Date.now() - entry.t < TTL) return entry;
  try {
    const fresh = { t: Date.now(), v: await fetcher() };
    memory.set(key, fresh);
    try {
      localStorage.setItem('cache:' + key, JSON.stringify(fresh));
    } catch {}
    return fresh;
  } catch (err) {
    // Lỗi mạng hoặc hết lượt gọi: dùng bản cũ nếu có, kèm cờ stale.
    if (entry) return { ...entry, stale: true, error: err };
    throw err;
  }
}
