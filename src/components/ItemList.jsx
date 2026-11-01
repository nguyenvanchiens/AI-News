import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { PIPELINES, ProxyMissingError, RateLimitError, SEVERITY, SOURCES } from '../lib/sources.js';
import { compact, matches, timeAgo } from '../lib/format.js';
import { useVi } from '../lib/translate.js';
import { COST_FILTERS, COST_LEVELS, getCost, useCost, useCostAnalysis } from '../lib/cost.js';
import { Icon } from './Icon.jsx';

// Tiêu đề của repo và mô hình là tên riêng, không dịch.
export const translatable = (item) => !['gh', 'hf', 'llm'].includes(item.source);

const LICENSE_TEXT = { NOASSERTION: 'Giấy phép khác' };

export function ItemRow({ item, brief = false, showCost = false }) {
  const { saved, toggleSave, vi: viOn } = useApp();
  const isSaved = !!saved[item.id];
  const viTitle = useVi(translatable(item) ? item.title : null, viOn);
  const viSummary = useVi(!brief && item.summary ? item.summary.slice(0, 400) : null, viOn);
  const showOriginal = viTitle && viTitle.toLowerCase() !== item.title.toLowerCase();
  const cost = useCost(item, showCost);

  return (
    <li className="item" data-source={item.source}>
      <div className="item-body">
        <a className="item-title" href={item.url} target="_blank" rel="noreferrer" lang={viTitle ? 'vi' : 'en'}>
          {viTitle || item.title}
        </a>
        {showOriginal && (
          <p className="item-original" lang="en">
            {item.title}
          </p>
        )}
        {!brief && item.summary && <p className="item-summary">{viSummary || item.summary}</p>}
        <div className="item-meta">
          <span className="item-source">{SOURCES[item.source].label}</span>
          {showCost && (
            <span className="cost" data-cost={cost?.level ?? 'pending'} title={cost?.reasons.join('; ')}>
              {cost ? COST_LEVELS[cost.level] : 'Đang xem chi phí…'}
            </span>
          )}
          {item.severity && SEVERITY[item.severity] && (
            <span className="sev" data-sev={item.severity}>
              {SEVERITY[item.severity]}
            </span>
          )}
          {item.domain && <span>{item.domain}</span>}
          {item.author && <span>{item.author}</span>}
          {item.price && (
            <span className="price" data-free={item.free || undefined}>
              {item.price}
            </span>
          )}
          {item.context && <span>{item.context}</span>}
          {item.language && <span>{item.language}</span>}
          {showCost && item.license && <span>{LICENSE_TEXT[item.license] || `Giấy phép ${item.license}`}</span>}
          {item.pipeline && <span>{PIPELINES[item.pipeline] || item.pipeline}</span>}
          {item.downloads != null && <span>{compact(item.downloads)} lượt tải</span>}
          {item.readingTime ? <span>{item.readingTime} phút đọc</span> : null}
          {item.totalStars != null && <span>tổng {compact(item.totalStars)} sao</span>}
          {item.time != null && (
            <time dateTime={new Date(item.time).toISOString()}>
              {item.timePrefix ? `${item.timePrefix} ${timeAgo(item.time).toLowerCase()}` : timeAgo(item.time)}
            </time>
          )}
          {!brief && item.comments != null && item.discussUrl && (
            <a href={item.discussUrl} target="_blank" rel="noreferrer">
              {item.source === 'paper' ? 'arXiv' : `${item.comments} bình luận`}
            </a>
          )}
          {!brief && item.tryUrl && (
            <a href={item.tryUrl} target="_blank" rel="noreferrer">
              {item.tryLabel}
            </a>
          )}
          {!brief && item.github && (
            <a href={item.github} target="_blank" rel="noreferrer">
              Mã nguồn
            </a>
          )}
        </div>
        {showCost && !brief && cost?.reasons.length > 0 && (
          <p className="cost-reasons">Dựa trên README: {cost.reasons.join(', ')}.</p>
        )}
        {!brief && item.tags?.length > 0 && (
          <ul className="tags">
            {item.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="item-side">
        {item.score != null && (
          <span className="score">
            <strong>{compact(item.score)}</strong>
            <small>{item.scoreUnit}</small>
          </span>
        )}
        <button
          className="save-btn"
          aria-pressed={isSaved}
          aria-label={isSaved ? `Bỏ lưu: ${item.title}` : `Lưu: ${item.title}`}
          title={isSaved ? 'Bỏ lưu' : 'Lưu để đọc sau'}
          onClick={() => toggleSave(item)}
        >
          <Icon name="saved" size={16} filled={isSaved} />
        </button>
      </div>
    </li>
  );
}

function emptyText(query, costFilter) {
  if (COST_FILTERS[costFilter]) {
    return `Không có repo nào thuộc nhóm “${COST_FILTERS[costFilter].label}” trong danh sách này. Chọn “Tất cả” để xem hết.`;
  }
  if (query) return `Không có mục nào khớp “${query}”. Thử từ khóa khác hoặc xóa ô lọc.`;
  return 'Nguồn này chưa có mục nào.';
}

function errorText(error) {
  if (error instanceof RateLimitError) {
    return 'Nguồn này đang giới hạn số lượt gọi (GitHub cho khoảng 10 lượt tìm kiếm mỗi phút khi chưa đăng nhập). Đợi một phút rồi thử lại.';
  }
  if (error instanceof ProxyMissingError) {
    return 'Nguồn này cần proxy nhưng proxy chưa chạy ở nơi đang mở app. Xem mục "Đưa lên Cloudflare" trong README.';
  }
  return `Không tải được dữ liệu (${error.message}). Kiểm tra kết nối mạng rồi thử lại.`;
}

const PAGE_SIZE = 20;

// Rút gọn dãy số trang: 1 … 4 5 6 … 12
function pageNumbers(page, total) {
  const pages = [...new Set([1, page - 1, page, page + 1, total])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i && p - pages[i - 1] > 1 ? ['gap' + p, p] : [p]));
}

// Bản gọn cho các khối ở trang Tổng quan.
function CompactPager({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <nav className="pager pager-compact" aria-label="Phân trang">
      <button className="pager-btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        ‹
      </button>
      <span className="pager-count">
        Trang {page}/{total}
      </span>
      <button className="pager-btn" disabled={page === total} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        ›
      </button>
    </nav>
  );
}

function Pager({ page, total, count, onChange }) {
  if (count === 0) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);
  return (
    <nav className="pager" aria-label="Phân trang">
      <span className="pager-count">
        {from}–{to} trong {count} mục
      </span>
      <button className="pager-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Trước
      </button>
      {pageNumbers(page, total).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="pager-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            className="pager-btn"
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Trang ${p}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button className="pager-btn" disabled={page === total} onClick={() => onChange(page + 1)}>
        Sau
      </button>
    </nav>
  );
}

export function ItemList({ state, limit, brief = false, showCost = false, costFilter = '' }) {
  const { query } = useApp();
  const [page, setPage] = useState(1);
  const listRef = useRef(null);

  // Đổi dữ liệu, từ khóa hoặc bộ lọc thì quay về trang đầu.
  useEffect(() => setPage(1), [state.items, query, costFilter]);

  const matched = (state.items || []).filter((i) => matches(i, query));
  const levels = COST_FILTERS[costFilter]?.levels;
  const filtered = levels ? matched.filter((i) => levels.includes(getCost(i)?.level)) : matched;
  const waiting = levels ? matched.filter((i) => !getCost(i)).length : 0;
  // Có `limit` (khối ở trang Tổng quan) thì mỗi trang chỉ `limit` mục và dùng thanh phân trang gọn.
  const pageSize = limit ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const items = filtered.slice((current - 1) * pageSize, current * pageSize);

  // Khi lọc theo chi phí phải phân tích cả danh sách; còn lại chỉ cần trang đang xem.
  useCostAnalysis(showCost ? (levels ? matched : items) : null);

  const goTo = (p) => {
    setPage(p);
    if (limit != null) return;
    const top = listRef.current?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: Math.max(0, top + window.scrollY - 90) });
  };

  if (!state.items && state.loading) {
    return (
      <ol className="items" aria-busy="true" aria-label="Đang tải">
        {Array.from({ length: Math.min(limit ?? 8, 8) }, (_, i) => (
          <li key={i} className="item item-skeleton">
            <span />
            <span />
          </li>
        ))}
      </ol>
    );
  }

  if (!state.items) {
    return (
      <div className="notice" role="alert">
        <p>{errorText(state.error)}</p>
        <button className="text-btn" onClick={state.retry}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <>
      {state.stale && (
        <p className="notice notice-quiet">
          Đang hiện dữ liệu đã lưu trước đó vì chưa tải được bản mới.
          <button className="text-btn" onClick={state.retry}>
            Thử lại
          </button>
        </p>
      )}
      {waiting > 0 && <p className="notice notice-quiet">Đang đọc README của {waiting} repo để phân loại chi phí…</p>}
      {items.length === 0 ? (
        !waiting && <p className="empty">{emptyText(query, costFilter)}</p>
      ) : (
        <ol className="items" ref={listRef}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} brief={brief} showCost={showCost} />
          ))}
        </ol>
      )}
      {limit != null ? (
        <CompactPager page={current} total={totalPages} onChange={goTo} />
      ) : (
        <Pager page={current} total={totalPages} count={filtered.length} onChange={goTo} />
      )}
    </>
  );
}
