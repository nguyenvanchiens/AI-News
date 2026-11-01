import { useState } from 'react';
import { queries } from '../lib/sources.js';
import { useData } from '../lib/store.jsx';
import { toEnglish } from '../lib/translate.js';
import { COST_FILTERS } from '../lib/cost.js';
import { ItemList } from '../components/ItemList.jsx';
import { Icon } from '../components/Icon.jsx';
import { Chips, PageHeader, usePersisted } from '../components/Page.jsx';

// GitHub không cho OR giữa các bộ lọc topic:, nhưng cho OR giữa từ khóa khi tìm "in:topics".
// Mỗi truy vấn tối đa 5 toán tử OR (6 từ khóa), quá số đó GitHub trả lỗi 422.
export const topics = (...names) => {
  if (names.length > 6) console.warn('GitHub chỉ nhận tối đa 6 từ khóa OR:', names);
  return `${names.join(' OR ')} in:topics`;
};

const TOOL_GROUPS = [
  {
    label: 'Video và âm thanh',
    items: [
      ['video-ai', 'Tạo video bằng AI', topics('text-to-video', 'video-generation', 'image-to-video')],
      ['video-edit', 'Dựng và chỉnh video', topics('video-editing', 'video-editor', 'ffmpeg')],
      ['tts', 'Văn bản thành giọng nói', topics('text-to-speech', 'tts', 'voice-cloning')],
      ['stt', 'Giọng nói thành chữ', topics('speech-to-text', 'whisper', 'asr')],
      ['subtitle', 'Phụ đề và lồng tiếng', topics('subtitles', 'subtitle', 'video-translation', 'dubbing')],
      ['avatar', 'Người ảo, nhép môi', topics('digital-human', 'talking-head', 'lip-sync')],
      ['music', 'Nhạc và âm thanh', topics('music-generation', 'audio-generation', 'text-to-music')],
      ['image', 'Tạo và sửa ảnh', topics('image-generation', 'stable-diffusion', 'comfyui')],
      ['download', 'Tải video', topics('video-downloader', 'youtube-downloader', 'yt-dlp')],
      ['record', 'Quay màn hình', topics('screen-recorder', 'screen-recording', 'screen-capture')],
    ],
  },
  {
    label: 'Hay ho khác',
    items: [
      ['local-ai', 'Chạy AI trên máy', topics('local-llm', 'ollama', 'llama-cpp')],
      ['selfhost', 'Tự host thay dịch vụ trả phí', topics('self-hosted', 'selfhosted')],
      ['automation', 'Tự động hóa', topics('workflow-automation', 'automation', 'rpa')],
      ['productivity', 'Ghi chú, năng suất', topics('note-taking', 'productivity', 'knowledge-base')],
      ['learn', 'Học lập trình', topics('roadmap', 'tutorial', 'learning-resources')],
      ['awesome', 'Danh sách awesome', topics('awesome-list', 'awesome')],
    ],
  },
];

// Khung chung cho các trang "danh mục repo": chọn danh mục hoặc tự tìm (nhận tiếng Việt),
// xếp hạng, lọc chi phí. Mỗi mục danh mục là [id, nhãn, truy vấn GitHub, lưu ý tùy chọn].
export function RepoCatalog({ prefKey, title, description, intro, groups, placeholder }) {
  const categories = Object.fromEntries(
    groups.flatMap((g) => g.items.map(([id, label, q, note]) => [id, { label, q, note }])),
  );
  const firstId = groups[0].items[0][0];

  const [cat, setCat] = usePersisted(`${prefKey}.category`, firstId);
  const [mode, setMode] = usePersisted(`${prefKey}.mode`, 'stars');
  const [costFilter, setCostFilter] = usePersisted(`${prefKey}.cost`, '');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState(null);
  const [translating, setTranslating] = useState(false);

  const catId = categories[cat] ? cat : firstId;
  const category = categories[catId];
  const cost = COST_FILTERS[costFilter] ? costFilter : '';
  const state = useData(search ? queries.keywordSearch(search.en, mode) : queries.repoSearch(category.q, mode));

  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return setSearch(null);
    setTranslating(true);
    try {
      setSearch({ text, en: await toEnglish(text) });
    } finally {
      setTranslating(false);
    }
  };

  const pickCategory = (id) => {
    setSearch(null);
    setInput('');
    setCat(id);
  };

  return (
    <div className="page">
      <PageHeader title={title} description={description}>
        {intro && <p className="notice notice-quiet catalog-intro">{intro}</p>}
        <form className="repo-search" role="search" onSubmit={submit}>
          <label className="search">
            <Icon name="search" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              aria-label="Tìm repo trên GitHub"
            />
          </label>
          <button className="icon-btn" type="submit" disabled={translating}>
            {translating ? 'Đang dịch…' : 'Tìm trên GitHub'}
          </button>
        </form>
        {groups.map((g) => (
          <div key={g.label} className="chip-group">
            <span className="chip-group-label">{g.label}</span>
            <Chips
              label={g.label}
              value={search ? null : catId}
              onChange={pickCategory}
              options={g.items.map(([id, label]) => [id, label])}
            />
          </div>
        ))}
        <div className="chip-group">
          <span className="chip-group-label">Xếp theo</span>
          <Chips
            label="Xếp theo"
            value={mode}
            onChange={setMode}
            options={[
              ['stars', 'Nhiều sao nhất'],
              ['active', 'Đang được cập nhật'],
              ['new', 'Mới nổi trong 3 tháng'],
            ]}
          />
        </div>
        <div className="chip-group">
          <span className="chip-group-label">
            Chi phí (ước tính từ README; mục chưa chắc chắn hiện ở cả hai nhóm để không bỏ sót)
          </span>
          <Chips
            label="Chi phí"
            value={cost}
            onChange={setCostFilter}
            options={[['', 'Tất cả'], ...Object.entries(COST_FILTERS).map(([k, f]) => [k, f.label])]}
          />
        </div>
      </PageHeader>

      {search ? (
        <p className="search-note">
          Kết quả cho “{search.text}”
          {search.en.toLowerCase() !== search.text.toLowerCase() && <> (đã tìm trên GitHub bằng “{search.en}”)</>}.{' '}
          <button className="text-btn" onClick={() => pickCategory(catId)}>
            Quay lại danh mục
          </button>
        </p>
      ) : (
        category.note && <p className="notice catalog-note">{category.note}</p>
      )}
      <ItemList state={state} showCost costFilter={cost} />
    </div>
  );
}

export function Tools() {
  return (
    <RepoCatalog
      prefKey="tools"
      title="Kho công cụ"
      description="Phần mềm mã nguồn mở theo nhu cầu: làm video, giọng nói, phụ đề, tạo ảnh và nhiều thứ hay ho khác. Chọn một danh mục hoặc tự tìm, gõ tiếng Việt cũng được."
      groups={TOOL_GROUPS}
      placeholder="Ví dụ: tách giọng hát khỏi nhạc"
    />
  );
}
