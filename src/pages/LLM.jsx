import { useMemo } from 'react';
import { LLM_PROVIDERS, queries } from '../lib/sources.js';
import { useData } from '../lib/store.jsx';
import { ItemList } from '../components/ItemList.jsx';
import { Chips, PageHeader, usePersisted } from '../components/Page.jsx';

const CHAT_APPS = [
  ...Object.values(LLM_PROVIDERS)
    .filter((p) => p.chat)
    .map((p) => ({ app: p.app, maker: p.label, url: p.chat })),
  { app: 'OpenRouter Chat', maker: 'Thử hàng trăm mô hình khác', url: 'https://openrouter.ai/chat' },
];

const SORTS = {
  new: (a, b) => b.time - a.time,
  cheap: (a, b) => a.priceOut - b.priceOut || b.time - a.time,
  context: (a, b) => b.contextLength - a.contextLength || b.time - a.time,
};

export function LLM() {
  const [provider, setProvider] = usePersisted('llm.provider', '');
  const [kind, setKind] = usePersisted('llm.kind', '');
  const [sort, setSort] = usePersisted('llm.sort', 'new');
  const raw = useData(queries.llms());

  const state = useMemo(() => {
    if (!raw.items) return raw;
    const items = raw.items
      .filter((m) => !provider || m.provider === provider)
      .filter((m) => (kind === 'free' ? m.free : kind === 'open' ? m.openWeights : true))
      .sort(SORTS[sort] || SORTS.new);
    return { ...raw, items };
  }, [raw, provider, kind, sort]);

  return (
    <div className="page">
      <PageHeader
        title="LLM"
        description="Các mô hình ngôn ngữ lớn mới ra mắt, kèm giá gọi API, độ dài ngữ cảnh và chỗ dùng thử. Dữ liệu từ OpenRouter, nơi tổng hợp mô hình của hầu hết các hãng."
      />

      <section className="try-apps" aria-labelledby="try-title">
        <h2 id="try-title">Dùng thử ngay</h2>
        <p className="page-desc">
          Trang chat chính thức của từng hãng. Hầu hết có bản miễn phí giới hạn lượt dùng; mô hình mạnh nhất thường cần gói trả phí.
        </p>
        <ul>
          {CHAT_APPS.map((c) => (
            <li key={c.url}>
              <a href={c.url} target="_blank" rel="noreferrer">
                <strong>{c.app}</strong>
                <span>{c.maker}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="filters">
        <div className="chip-group">
          <span className="chip-group-label">Hãng</span>
          <Chips
            label="Hãng"
            value={provider}
            onChange={setProvider}
            options={[['', 'Tất cả'], ...Object.entries(LLM_PROVIDERS).map(([k, p]) => [k, p.label])]}
          />
        </div>
        <div className="chip-group">
          <span className="chip-group-label">Loại</span>
          <Chips
            label="Loại"
            value={kind}
            onChange={setKind}
            options={[
              ['', 'Tất cả'],
              ['free', 'Miễn phí qua API'],
              ['open', 'Mở trọng số, tải về chạy được'],
            ]}
          />
        </div>
        <div className="chip-group">
          <span className="chip-group-label">Sắp xếp</span>
          <Chips
            label="Sắp xếp"
            value={sort}
            onChange={setSort}
            options={[
              ['new', 'Mới nhất'],
              ['cheap', 'Rẻ nhất'],
              ['context', 'Ngữ cảnh dài nhất'],
            ]}
          />
        </div>
      </div>

      <ItemList state={state} />
    </div>
  );
}
