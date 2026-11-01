import { useMemo, useRef, useState } from 'react';
import { SOURCES } from '../lib/sources.js';
import { compact, timeAgo } from '../lib/format.js';
import { useApp } from '../lib/store.jsx';
import { useVi } from '../lib/translate.js';
import { translatable } from './ItemList.jsx';

const DAY = 86400000;
const weekday = new Intl.DateTimeFormat('vi', { weekday: 'short' });

// Mỗi mục là một vạch theo thời gian; độ cao = thứ hạng độ quan tâm trong cùng nguồn.
export function PulseStrip({ items, loading = false, days = 7 }) {
  const [now] = useState(() => Date.now());
  const start = now - days * DAY;
  const [hidden, setHidden] = useState(() => new Set());
  const [activeId, setActiveId] = useState(null);
  const svgRef = useRef(null);
  const pointerType = useRef('mouse');
  const { vi: viOn } = useApp();

  const ticks = useMemo(() => {
    const groups = {};
    for (const it of items) {
      if (it.time >= start && it.time <= now) (groups[it.source] ||= []).push(it);
    }
    const out = [];
    for (const list of Object.values(groups)) {
      // Mục không có điểm (tin RSS) đứng ở độ cao trung bình.
      const scored = list.filter((it) => it.score != null).sort((a, b) => b.score - a.score);
      const n = scored.length;
      const x = (item) => (item.time - start) / (now - start);
      scored.forEach((item, i) => out.push({ item, x: x(item), h: n === 1 ? 1 : 1 - (i / (n - 1)) * 0.82 }));
      list.filter((it) => it.score == null).forEach((item) => out.push({ item, x: x(item), h: 0.45 }));
    }
    return out.sort((a, b) => a.x - b.x);
  }, [items, start, now]);

  const dayMarks = useMemo(() => {
    const marks = [];
    const d = new Date(start);
    d.setHours(24, 0, 0, 0);
    for (; d.getTime() < now; d.setDate(d.getDate() + 1)) {
      marks.push({ x: (d.getTime() - start) / (now - start), wd: weekday.format(d), date: `${d.getDate()}/${d.getMonth() + 1}` });
    }
    return marks;
  }, [start, now]);

  const counts = {};
  for (const t of ticks) counts[t.item.source] = (counts[t.item.source] || 0) + 1;

  const visible = ticks.filter((t) => !hidden.has(t.item.source));
  const active =
    visible.find((t) => t.item.id === activeId) ??
    visible.reduce((best, t) => (!best || t.h > best.h || (t.h === best.h && t.x > best.x) ? t : best), null);

  const pickAt = (clientX) => {
    if (!visible.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const fx = (clientX - rect.left) / rect.width;
    let best = visible[0];
    for (const t of visible) {
      const d = Math.abs(t.x - fx);
      const bd = Math.abs(best.x - fx);
      if (d < bd - 0.002 || (Math.abs(d - bd) <= 0.002 && t.h > best.h)) best = t;
    }
    setActiveId(best.item.id);
  };

  const open = (t) => t && window.open(t.item.url, '_blank', 'noopener');

  const onKeyDown = (e) => {
    if (!visible.length) return;
    const i = Math.max(0, visible.indexOf(active));
    const go = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: visible.length - 1 }[e.key];
    if (go != null) {
      e.preventDefault();
      setActiveId(visible[Math.min(visible.length - 1, Math.max(0, go))].item.id);
    } else if (e.key === 'Enter') {
      open(active);
    }
  };

  const viTitle = useVi(active && translatable(active.item) ? active.item.title : null, viOn);

  const toggle = (src) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(src) ? next.delete(src) : next.add(src);
      return next;
    });

  return (
    <section className="pulse" aria-labelledby="pulse-title">
      <div className="pulse-head">
        <h2 id="pulse-title">Mạch {days} ngày</h2>
        <ul className="legend">
          {Object.keys(SOURCES).map((src) => (
            <li key={src}>
              <button className="legend-btn" data-source={src} aria-pressed={!hidden.has(src)} onClick={() => toggle(src)}>
                <span className="legend-swatch" />
                {SOURCES[src].label}
                <span className="legend-count">{counts[src] || 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="pulse-chart">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          tabIndex={0}
          role="img"
          aria-label={`Biểu đồ ${visible.length} mục trong ${days} ngày qua. Dùng phím mũi tên để duyệt, Enter để mở.`}
          onPointerMove={(e) => e.pointerType === 'mouse' && pickAt(e.clientX)}
          onPointerDown={(e) => {
            pointerType.current = e.pointerType;
            pickAt(e.clientX);
          }}
          onClick={() => pointerType.current === 'mouse' && open(active)}
          onKeyDown={onKeyDown}
        >
          {dayMarks.map((m) => (
            <line key={m.date} className="pulse-day" x1={m.x * 1000} x2={m.x * 1000} y1="0" y2="100" />
          ))}
          <line className="pulse-base" x1="0" x2="1000" y1="100" y2="100" />
          {visible.map((t) => (
            <line
              key={t.item.id}
              className="pulse-tick"
              x1={t.x * 1000}
              x2={t.x * 1000}
              y1="100"
              y2={100 - t.h * 94}
              style={{ stroke: `var(--c-${t.item.source})` }}
            />
          ))}
          {active && (
            <line
              className="pulse-tick pulse-tick-active"
              x1={active.x * 1000}
              x2={active.x * 1000}
              y1="100"
              y2={100 - active.h * 94}
            />
          )}
        </svg>
        <div className="pulse-days" aria-hidden="true">
          {dayMarks.map((m) => (
            <span key={m.date} style={{ left: `${m.x * 100}%` }}>
              <span className="pulse-wd">{m.wd} </span>
              {m.date}
            </span>
          ))}
        </div>
      </div>

      <div className="pulse-detail" aria-live="polite">
        {active ? (
          <>
            <div className="item-meta" data-source={active.item.source}>
              <span className="item-source">{SOURCES[active.item.source].label}</span>
              {active.item.domain && <span>{active.item.domain}</span>}
              <time>{timeAgo(active.item.time)}</time>
              {active.item.score != null && (
                <span>
                  {compact(active.item.score)} {active.item.scoreUnit}
                </span>
              )}
            </div>
            <a className="pulse-detail-title" href={active.item.url} target="_blank" rel="noreferrer">
              {viTitle || active.item.title}
            </a>
          </>
        ) : loading ? (
          <p className="empty">Đang tải dữ liệu từ các nguồn…</p>
        ) : (
          <p className="empty">Bật ít nhất một nguồn ở chú thích phía trên để xem mạch tin.</p>
        )}
      </div>
    </section>
  );
}
