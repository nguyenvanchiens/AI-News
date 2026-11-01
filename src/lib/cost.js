import { useEffect, useSyncExternalStore } from 'react';

// Ước tính chi phí sử dụng một repo bằng cách đọc README (qua raw.githubusercontent.com,
// không tính vào giới hạn API của GitHub). Đây là suy luận từ từ khóa, không phải thông tin chính thức.
// Đổi hậu tố khi sửa quy tắc phân loại để bỏ kết quả cũ.
const STORE_KEY = 'cost-cache-v3';
const TTL = 7 * 86400000;
const CONCURRENCY = 6;

export const COST_LEVELS = {
  free: 'Miễn phí',
  freemium: 'Miễn phí, có tùy chọn trả phí',
  paid: 'Cần dịch vụ trả phí',
  unknown: 'Chưa rõ, nên kiểm tra',
};

// Bộ lọc chỉ có hai nhóm. Mục chưa chắc chắn (freemium, unknown) nằm ở cả hai để không bị bỏ sót.
export const COST_FILTERS = {
  free: { label: 'Miễn phí', levels: ['free', 'freemium', 'unknown'] },
  paid: { label: 'Có trả phí', levels: ['paid', 'freemium', 'unknown'] },
};

// Dịch vụ AI tính tiền theo lượt dùng, nhận diện qua tên biến môi trường hoặc tên miền.
const PAID_SERVICES = [
  ['OpenAI', /OPENAI_API_KEY|openai api key|api\.openai\.com/i],
  ['Anthropic', /ANTHROPIC_API_KEY|anthropic api key/i],
  ['Gemini', /GEMINI_API_KEY|GOOGLE_API_KEY|gemini api key/i],
  ['ElevenLabs', /elevenlabs/i],
  ['fal.ai', /FAL_KEY|fal\.ai/i],
  ['Replicate', /REPLICATE_API|replicate\.com/i],
  ['Runway', /RUNWAY(ML)?_API|runwayml\.com/i],
  ['HeyGen', /heygen/i],
  ['Suno', /SUNO_API|suno\.(ai|com)/i],
  ['Kling', /KLING_API|klingai/i],
  ['Azure', /AZURE_[A-Z_]*KEY|azure (openai|speech|tts)/i],
  ['OpenRouter', /openrouter/i],
  ['DeepSeek API', /DEEPSEEK_API_KEY/i],
  ['DashScope', /dashscope/i],
];

const LOCAL =
  /\b(offline|runs? locally|running locally|locally on your|on-device|on your (own )?(machine|computer|device|gpu|pc)|self-host(ed|able)?|local (models?|inference|gpu|llm)|ollama|llama\.cpp|no api keys?|without (any |an )?api keys?|no cloud)\b|本地|离线/i;

// Dự án tự tải mô hình về chạy (thường cần card đồ họa), dù README không ghi chữ "offline".
const LOCAL_MODEL =
  /\b(checkpoints?|pretrained (models?|weights)|model weights|download (the )?(models?|weights))\b|huggingface\.co\/[\w-]+\/[\w.-]+|modelscope\.cn/i;
const GPU = /\b(cuda|vram|gpus?|nvidia)\b|显存/i;

// README tự nhận là miễn phí: khi đó không xếp chắc chắn vào nhóm trả phí.
const SAYS_FREE =
  /\b(100% free|completely free|totally free|free forever|free (and|&) open[- ]source)\b|完全免费|免费开源/i;

const SAAS =
  /\b(pricing|subscription|pro plan|paid plan|premium plan|free trial|buy credits|upgrade to pro|commercial license)\b|付费|收费|会员|订阅|定价/i;

let cache = load();
let version = 0;
const listeners = new Set();
const queue = [];
const pending = new Set();
let running = 0;
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
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cache));
    } catch {}
  }, 500);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const fresh = (key) => cache[key] && Date.now() - cache[key].t < TTL;

async function fetchReadme(fullName) {
  for (const name of ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README.rst', 'README']) {
    const res = await fetch(`https://raw.githubusercontent.com/${fullName}/HEAD/${name}`);
    if (res.ok) return (await res.text()).slice(0, 200000);
  }
  return '';
}

export function classify(text, license) {
  const services = PAID_SERVICES.filter(([, re]) => re.test(text)).map(([name]) => name);
  const runsModel = LOCAL_MODEL.test(text);
  const local = LOCAL.test(text) || runsModel;
  const saas = SAAS.test(text);

  const reasons = [];
  if (LOCAL.test(text)) reasons.push('chạy được trên máy');
  else if (runsModel) reasons.push('tự tải mô hình về chạy');
  if (runsModel && GPU.test(text)) reasons.push('cần card đồ họa (GPU)');
  if (services.length) reasons.push(`có dùng ${services.slice(0, 4).join(', ')}`);
  if (saas) reasons.push('có nhắc tới gói trả phí');
  const saysFree = SAYS_FREE.test(text);
  if (saysFree) reasons.push('README tự ghi là miễn phí');
  if (!text) reasons.push('không đọc được README');

  let level;
  if (services.length && !local && !saysFree) level = 'paid';
  else if (services.length || saas) level = 'freemium';
  else if (local || license) level = 'free';
  else level = 'unknown';
  return { level, reasons };
}

function pump() {
  while (running < CONCURRENCY && queue.length) {
    const { key, license } = queue.shift();
    running++;
    fetchReadme(key)
      .then((text) => classify(text, license))
      .catch(() => ({ level: 'unknown', reasons: ['không đọc được README'] }))
      .then((result) => {
        cache[key] = { ...result, t: Date.now() };
        running--;
        pending.delete(key);
        version++;
        listeners.forEach((l) => l());
        persist();
        pump();
      });
  }
}

const keyOf = (item) => (item.source === 'gh' ? item.title : '');

// Xếp hàng phân tích cho cả danh sách (gọi ở cấp danh sách để bộ lọc hoạt động cả với mục đang ẩn).
export function useCostAnalysis(items) {
  useSyncExternalStore(subscribe, () => version);
  useEffect(() => {
    if (!items) return;
    for (const item of items) {
      const key = keyOf(item);
      if (!key || fresh(key) || pending.has(key)) continue;
      pending.add(key);
      queue.push({ key, license: item.license });
    }
    pump();
  }, [items]);
}

export function getCost(item) {
  return cache[keyOf(item)] ?? null;
}

export function useCost(item, enabled) {
  useSyncExternalStore(subscribe, () => version);
  return enabled ? getCost(item) : null;
}
