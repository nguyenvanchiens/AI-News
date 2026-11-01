const DAY = 86400000;

// Thứ tự ở đây cũng là thứ tự trong chú thích của dải Mạch.
export const SOURCES = {
  hn: { label: 'Hacker News' },
  lobsters: { label: 'Lobsters' },
  gh: { label: 'GitHub' },
  sec: { label: 'Bảo mật' },
  devto: { label: 'DEV' },
  llm: { label: 'LLM' },
  hf: { label: 'Hugging Face' },
  paper: { label: 'Bài báo' },
};

export const PIPELINES = {
  'text-generation': 'Sinh văn bản',
  'image-text-to-text': 'Hiểu ảnh và văn bản',
  'text-to-image': 'Tạo ảnh',
  'image-to-image': 'Sửa ảnh',
  'text-to-video': 'Tạo video',
  'image-to-video': 'Ảnh thành video',
  'text-to-speech': 'Văn bản thành giọng nói',
  'automatic-speech-recognition': 'Nhận dạng giọng nói',
  'feature-extraction': 'Embedding',
  'any-to-any': 'Đa phương thức',
};

export const SEVERITY = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  medium: 'Trung bình',
  moderate: 'Trung bình',
  low: 'Thấp',
};

export const HN_PRESETS = {
  top: { label: 'Nổi bật', query: '', minPoints: 100 },
  show: { label: 'Show HN', tag: 'show_hn', minPoints: 20 },
  ask: { label: 'Ask HN', tag: 'ask_hn', minPoints: 20 },
  ai: { label: 'AI', query: 'AI' },
  security: { label: 'Bảo mật', query: 'security' },
  javascript: { label: 'JavaScript', query: 'javascript' },
  python: { label: 'Python', query: 'python' },
  rust: { label: 'Rust', query: 'rust' },
};

export class RateLimitError extends Error {}

async function request(url) {
  const res = await fetch(url);
  if (res.status === 403 || res.status === 429) throw new RateLimitError(`HTTP ${res.status}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

const getJSON = async (url) => (await request(url)).json();

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function stripHtml(html) {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
}

/* ---------- Tin lập trình ---------- */

export async function fetchHN({ query = '', tag = 'story', minPoints = 10, days = 7, limit = 60 } = {}) {
  const since = Math.floor((Date.now() - days * DAY) / 1000);
  const params = new URLSearchParams({
    query,
    tags: tag,
    numericFilters: `created_at_i>${since},points>${minPoints}`,
    hitsPerPage: String(limit),
  });
  const data = await getJSON(`https://hn.algolia.com/api/v1/search?${params}`);
  return data.hits
    .map((h) => {
      const discussUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        id: `hn-${h.objectID}`,
        source: 'hn',
        title: h.title,
        url: h.url || discussUrl,
        discussUrl,
        domain: h.url ? hostname(h.url) : 'news.ycombinator.com',
        time: h.created_at_i * 1000,
        score: h.points,
        scoreUnit: 'điểm',
        comments: h.num_comments,
        author: h.author,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Lobsters không cho gọi thẳng từ trình duyệt nên đi qua proxy của Vite (vite.config.js).
export async function fetchLobsters({ tag = '' } = {}) {
  const data = await getJSON(`/proxy/lobsters/${tag ? `t/${tag}` : 'hottest'}.json`);
  return data
    .map((s) => ({
      id: `lobsters-${s.short_id}`,
      source: 'lobsters',
      title: s.title,
      url: s.url || s.comments_url,
      discussUrl: s.comments_url,
      domain: s.url ? hostname(s.url) : 'lobste.rs',
      time: Date.parse(s.created_at),
      score: s.score,
      scoreUnit: 'điểm',
      comments: s.comment_count,
      author: s.submitter_user,
      tags: s.tags,
    }))
    .sort((a, b) => b.score - a.score);
}

async function searchRepos(q, limit) {
  const params = new URLSearchParams({ q, sort: 'stars', order: 'desc', per_page: String(limit) });
  const data = await getJSON(`https://api.github.com/search/repositories?${params}`);
  return data.items.map((r) => ({
    id: `gh-${r.id}`,
    source: 'gh',
    title: r.full_name,
    url: r.html_url,
    summary: r.description,
    time: Date.parse(r.created_at),
    pushedAt: Date.parse(r.pushed_at),
    license: r.license?.spdx_id,
    score: r.stargazers_count,
    scoreUnit: 'sao',
    author: r.owner.login,
    language: r.language,
    tags: (r.topics || []).slice(0, 4),
  }));
}

// Repo mới tạo trong `days` ngày qua, xếp theo sao.
export async function fetchRepos({ topic = '', days = 7, limit = 60 } = {}) {
  const since = new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
  return searchRepos(`${topic ? `topic:${topic} ` : ''}created:>${since}`, limit);
}

// Repo nhiều sao nhất mọi thời đại; hiện thời điểm cập nhật gần nhất thay vì ngày tạo.
export async function fetchFamousRepos({ topic = '', limit = 100 } = {}) {
  const repos = await searchRepos(topic ? `topic:${topic} stars:>1000` : 'stars:>50000', limit);
  return repos.map((r) => ({ ...r, time: r.pushedAt, timePrefix: 'cập nhật' }));
}

// Tìm repo theo truy vấn tự do (Kho công cụ). `mode` quyết định kiểu xếp hạng.
export async function fetchRepoSearch({ q, mode = 'stars', minStars = 100, limit = 100 }) {
  const day = (n) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);
  const qualifier = {
    stars: `stars:>${minStars}`,
    new: `created:>${day(90)} stars:>20`,
    active: `pushed:>${day(7)} stars:>500`,
  }[mode];
  const repos = await searchRepos(`${q} ${qualifier}`, limit);
  return mode === 'new' ? repos : repos.map((r) => ({ ...r, time: r.pushedAt, timePrefix: 'cập nhật' }));
}

const STOP_WORDS = new Set(
  'a an the of for from to in on with and or by into onto that this is are be can how what which using use tool tools app apps software program open source free'.split(
    ' ',
  ),
);

// Tìm theo câu tự nhiên. GitHub đòi khớp mọi từ, nên bỏ từ phụ; nếu quá ít kết quả thì
// bỏ thêm từ đầu tiên (thường là động từ như "separate", "make") rồi gộp kết quả.
export async function fetchKeywordSearch({ text, mode = 'stars' }) {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#.-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  if (!words.length) return [];
  const run = (ws) => fetchRepoSearch({ q: `${ws.join(' ')} in:name,description,topics`, mode, minStars: 20 });
  let items = await run(words);
  if (items.length < 8 && words.length > 1) {
    const seen = new Set(items.map((i) => i.id));
    items = [...items, ...(await run(words.slice(1))).filter((i) => !seen.has(i.id))];
  }
  return items.sort((a, b) => b.score - a.score);
}

const TRENDING_UNIT = { daily: 'sao hôm nay', weekly: 'sao tuần này', monthly: 'sao tháng này' };

// GitHub Trending không có API: đọc trang HTML qua proxy của Vite.
export async function fetchTrending({ since = 'daily', language = '' } = {}) {
  const path = `/proxy/github/trending${language ? `/${encodeURIComponent(language)}` : ''}?since=${since}`;
  const html = await (await request(path)).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const num = (el) => Number(el?.textContent.replace(/[^\d]/g, '') || 0);
  return [...doc.querySelectorAll('article.Box-row')].map((row) => {
    const href = row.querySelector('h2 a').getAttribute('href');
    const fullName = href.slice(1);
    return {
      id: `gh-trending-${fullName}`,
      source: 'gh',
      title: fullName,
      url: `https://github.com${href}`,
      summary: row.querySelector('p')?.textContent.trim() || '',
      time: null,
      score: num(row.querySelector('.float-sm-right')),
      scoreUnit: TRENDING_UNIT[since],
      totalStars: num(row.querySelector('a[href$="/stargazers"]')),
      author: fullName.split('/')[0],
      language: row.querySelector('[itemprop="programmingLanguage"]')?.textContent.trim(),
    };
  });
}

export async function fetchArticles({ tag = 'programming', limit = 60 } = {}) {
  const data = await getJSON(`https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&top=7&per_page=${limit}`);
  return data
    .map((a) => ({
      id: `devto-${a.id}`,
      source: 'devto',
      title: a.title,
      url: a.url,
      summary: a.description,
      time: Date.parse(a.published_at),
      score: a.public_reactions_count,
      scoreUnit: 'lượt thích',
      comments: a.comments_count,
      author: a.user?.name,
      readingTime: a.reading_time_minutes,
      tags: a.tag_list,
    }))
    .sort((a, b) => b.score - a.score);
}

/* ---------- Bảo mật ---------- */

const SECURITY_FEEDS = [
  { path: '/proxy/thn/TheHackersNews', publisher: 'The Hacker News' },
  { path: '/proxy/bleeping/feed/', publisher: 'BleepingComputer' },
  { path: '/proxy/krebs/feed/', publisher: 'Krebs on Security' },
];

function parseRSS(xml, publisher) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return [...doc.querySelectorAll('item')].map((el) => {
    const text = (sel) => el.querySelector(sel)?.textContent.trim() || '';
    const link = text('link');
    return {
      id: `sec-${link}`,
      source: 'sec',
      title: text('title'),
      url: link,
      summary: stripHtml(text('description')),
      time: Date.parse(text('pubDate')),
      score: null,
      domain: publisher,
      tags: [...el.querySelectorAll('category')].map((c) => c.textContent.trim()).slice(0, 3),
    };
  });
}

// Gộp tin từ các trang tin bảo mật; một trang lỗi thì vẫn hiện các trang còn lại.
export async function fetchSecurityNews() {
  const results = await Promise.allSettled(
    SECURITY_FEEDS.map(async (f) => parseRSS(await (await request(f.path)).text(), f.publisher)),
  );
  const ok = results.filter((r) => r.status === 'fulfilled');
  if (!ok.length) throw results[0].reason;
  return ok.flatMap((r) => r.value).sort((a, b) => b.time - a.time);
}

export const ECOSYSTEMS = {
  npm: 'npm',
  pip: 'PyPI',
  maven: 'Maven',
  go: 'Go',
  composer: 'Composer',
  nuget: 'NuGet',
  rubygems: 'RubyGems',
  rust: 'crates.io',
};

// Lỗ hổng trong thư viện mã nguồn mở, đã được GitHub xác minh.
export async function fetchAdvisories({ ecosystem = '', severity = '' } = {}) {
  const params = new URLSearchParams({ type: 'reviewed', sort: 'published', direction: 'desc', per_page: '100' });
  if (ecosystem) params.set('ecosystem', ecosystem);
  if (severity) params.set('severity', severity);
  const data = await getJSON(`https://api.github.com/advisories?${params}`);
  return data.map((a) => {
    const v = a.vulnerabilities?.[0];
    const patched = v?.first_patched_version ? `Đã vá ở ${v.first_patched_version}.` : 'Chưa có bản vá.';
    return {
      id: `ghsa-${a.ghsa_id}`,
      source: 'sec',
      title: a.summary,
      url: a.html_url,
      summary: v ? `Phiên bản bị ảnh hưởng: ${v.vulnerable_version_range}. ${patched}` : stripHtml(a.description || ''),
      time: Date.parse(a.published_at),
      score: a.cvss?.score || null,
      scoreUnit: 'CVSS',
      severity: a.severity,
      domain: v ? `${ECOSYSTEMS[v.package.ecosystem] || v.package.ecosystem}: ${v.package.name}` : 'GitHub Advisory',
      tags: [a.cve_id, ...(a.cwes || []).map((c) => c.cwe_id)].filter(Boolean).slice(0, 3),
    };
  });
}

// CVE mức nghiêm trọng (CVSS 9.0 trở lên) công bố trong 7 ngày qua, từ NVD.
export async function fetchCriticalCVEs({ days = 7 } = {}) {
  const iso = (ms) => new Date(ms).toISOString().replace('Z', '');
  const params = new URLSearchParams({
    cvssV3Severity: 'CRITICAL',
    pubStartDate: iso(Date.now() - days * DAY),
    pubEndDate: iso(Date.now()),
    resultsPerPage: '100',
  });
  const data = await getJSON(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`);
  return data.vulnerabilities
    .map(({ cve }) => {
      const desc = cve.descriptions.find((d) => d.lang === 'en')?.value || '';
      const first = desc.split(/(?<=\.)\s/)[0];
      const title = first.length > 180 ? first.slice(0, 177) + '…' : first;
      const metric = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
      return {
        id: `nvd-${cve.id}`,
        source: 'sec',
        title,
        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        summary: first.length > 180 ? desc : desc.slice(first.length).trim(),
        time: Date.parse(cve.published + 'Z'),
        score: metric?.cvssData.baseScore ?? null,
        scoreUnit: 'CVSS',
        severity: metric?.cvssData.baseSeverity.toLowerCase(),
        domain: 'NVD',
        tags: [cve.id],
      };
    })
    .sort((a, b) => b.score - a.score || b.time - a.time);
}

/* ---------- AI ---------- */

// Trang chat chính thức của từng hãng; hãng không có trong danh sách thì thử qua OpenRouter.
export const LLM_PROVIDERS = {
  anthropic: { label: 'Anthropic', chat: 'https://claude.ai', app: 'Claude' },
  openai: { label: 'OpenAI', chat: 'https://chatgpt.com', app: 'ChatGPT' },
  google: { label: 'Google', chat: 'https://gemini.google.com', app: 'Gemini' },
  deepseek: { label: 'DeepSeek', chat: 'https://chat.deepseek.com', app: 'DeepSeek' },
  qwen: { label: 'Qwen', chat: 'https://chat.qwen.ai', app: 'Qwen Chat' },
  'x-ai': { label: 'xAI', chat: 'https://grok.com', app: 'Grok' },
  moonshotai: { label: 'Moonshot', chat: 'https://www.kimi.com', app: 'Kimi' },
  'z-ai': { label: 'Z.ai', chat: 'https://chat.z.ai', app: 'GLM' },
  mistralai: { label: 'Mistral', chat: 'https://chat.mistral.ai', app: 'Le Chat' },
  meta: { label: 'Meta', chat: 'https://www.meta.ai', app: 'Meta AI' },
  minimax: { label: 'MiniMax' },
};

const MODALITY = { image: 'Nhận ảnh', video: 'Nhận video', audio: 'Nhận âm thanh', file: 'Nhận tệp' };

function perMillion(perToken) {
  const n = Number(perToken) * 1e6;
  return `$${n < 1 ? +n.toFixed(3) : +n.toFixed(2)}`;
}

function tokens(n) {
  return n >= 1e6 ? `${+(n / 1048576).toFixed(1)}M` : `${Math.round(n / 1024)}K`;
}

// Danh sách LLM từ OpenRouter, kèm giá API và độ dài ngữ cảnh.
export async function fetchLLMs() {
  const { data } = await getJSON('https://openrouter.ai/api/v1/models');
  return data
    .filter((m) => !m.id.startsWith('~') && !m.id.startsWith('openrouter/') && !m.id.endsWith(':batch'))
    .filter((m) => Number(m.pricing?.prompt) >= 0)
    .map((m) => {
      const raw = m.id.split('/')[0];
      const provider = raw === 'meta-llama' ? 'meta' : raw;
      const info = LLM_PROVIDERS[provider];
      const free = Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0;
      const [maker, ...rest] = m.name.split(': ');
      return {
        id: `llm-${m.id}`,
        source: 'llm',
        title: rest.join(': ') || m.name,
        url: `https://openrouter.ai/${m.id}`,
        summary: m.description,
        time: m.created * 1000,
        score: null,
        author: info?.label || maker,
        provider,
        free,
        openWeights: !!m.hugging_face_id,
        priceOut: Number(m.pricing.completion),
        contextLength: m.context_length,
        price: free ? 'Miễn phí qua API' : `${perMillion(m.pricing.prompt)} vào, ${perMillion(m.pricing.completion)} ra /1M token`,
        context: `${tokens(m.context_length)} token ngữ cảnh`,
        tryUrl: info?.chat || `https://openrouter.ai/chat?models=${m.id}`,
        tryLabel: info?.chat ? `Dùng thử trên ${info.app}` : 'Dùng thử qua OpenRouter',
        tags: [
          ...(m.architecture?.input_modalities || []).map((x) => MODALITY[x]).filter(Boolean),
          ...(m.supported_parameters?.includes('reasoning') ? ['Suy luận'] : []),
          ...(m.hugging_face_id ? ['Mở trọng số'] : []),
        ],
      };
    })
    .sort((a, b) => b.time - a.time);
}

export async function fetchModels({ pipeline = '', limit = 60 } = {}) {
  const params = new URLSearchParams({ sort: 'trendingScore', limit: String(limit) });
  if (pipeline) params.set('pipeline_tag', pipeline);
  const data = await getJSON(`https://huggingface.co/api/models?${params}`);
  return data.map((m) => ({
    id: `hf-${m.id}`,
    source: 'hf',
    title: m.id,
    url: `https://huggingface.co/${m.id}`,
    time: Date.parse(m.createdAt),
    score: m.likes,
    scoreUnit: 'thích',
    downloads: m.downloads,
    author: m.author || m.id.split('/')[0],
    pipeline: m.pipeline_tag,
  }));
}

export async function fetchPapers({ limit = 50 } = {}) {
  const data = await getJSON(`https://huggingface.co/api/daily_papers?limit=${limit}`);
  return data
    .map(({ paper: p, numComments }) => ({
      id: `paper-${p.id}`,
      source: 'paper',
      title: p.title,
      url: `https://huggingface.co/papers/${p.id}`,
      discussUrl: `https://arxiv.org/abs/${p.id}`,
      summary: p.ai_summary || p.summary,
      time: Date.parse(p.publishedAt),
      score: p.upvotes,
      scoreUnit: 'upvote',
      comments: numComments,
      author: p.authors.slice(0, 3).map((a) => a.name).join(', ') + (p.authors.length > 3 ? ' và cộng sự' : ''),
      github: p.githubRepo,
      tags: (p.ai_keywords || []).slice(0, 4),
    }))
    .sort((a, b) => b.score - a.score);
}

// Khóa cache dùng chung giữa trang Tổng quan và các trang chi tiết.
export const queries = {
  // Khung 24 giờ có ít tin vượt 100 điểm, nên hạ ngưỡng để danh sách không quá ngắn.
  hn: (preset, days) => [
    `hn:${preset}:${days}:v2`,
    () => {
      const p = HN_PRESETS[preset];
      return fetchHN({ ...p, days, minPoints: days === 1 ? Math.min(p.minPoints ?? 10, 30) : p.minPoints });
    },
  ],
  lobsters: (tag) => [`lobsters:${tag}`, () => fetchLobsters({ tag })],
  repos: (topic, days) => [`gh:${topic}:${days}`, () => fetchRepos({ topic, days })],
  repoSearch: (q, mode) => [`gh:search:${q}:${mode}`, () => fetchRepoSearch({ q, mode })],
  keywordSearch: (text, mode) => [`gh:keyword:${text}:${mode}`, () => fetchKeywordSearch({ text, mode })],
  famousRepos: (topic) =>[`gh:famous:${topic}`, () => fetchFamousRepos({ topic })],
  trending: (since, language) => [`gh:trending:${since}:${language}`, () => fetchTrending({ since, language })],
  articles: (tag) => [`devto:${tag}`, () => fetchArticles({ tag })],
  securityNews: () => ['sec:news', () => fetchSecurityNews()],
  advisories: (ecosystem, severity) => [`sec:ghsa:${ecosystem}:${severity}`, () => fetchAdvisories({ ecosystem, severity })],
  cves: () => ['sec:nvd', () => fetchCriticalCVEs()],
  llms: () => ['llm:openrouter', () => fetchLLMs()],
  models: (pipeline) =>[`hf:${pipeline}`, () => fetchModels({ pipeline })],
  papers: () => ['papers', () => fetchPapers()],
};
