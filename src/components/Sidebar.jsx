import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { Icon } from './Icon.jsx';

// Menu chia nhóm để danh sách không quá dài; nhóm có thể thu gọn.
export const NAV_GROUPS = [
  { id: 'top', items: [{ id: 'overview', label: 'Tổng quan' }] },
  {
    id: 'news',
    label: 'Tin tức',
    items: [
      { id: 'news', label: 'Tin lập trình' },
      { id: 'security', label: 'Bảo mật' },
      { id: 'articles', label: 'Bài viết' },
    ],
  },
  {
    id: 'code',
    label: 'Mã nguồn',
    items: [
      { id: 'repos', label: 'Repo GitHub' },
      { id: 'tools', label: 'Kho công cụ' },
      { id: 'money', label: 'Kiếm tiền với AI' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    items: [
      { id: 'llm', label: 'LLM mới' },
      { id: 'models', label: 'Mô hình mở' },
      { id: 'papers', label: 'Bài báo' },
    ],
  },
  { id: 'bottom', items: [{ id: 'saved', label: 'Đã lưu' }] },
];

export function pageLabel(route) {
  for (const g of NAV_GROUPS) for (const n of g.items) if (n.id === route) return n.label;
  return 'Tổng quan';
}

function loadCollapsed() {
  try {
    return new Set(JSON.parse(localStorage.getItem('nav.collapsed') || '[]'));
  } catch {
    return new Set();
  }
}

export function Sidebar({ route, open, onClose }) {
  const { saved } = useApp();
  const savedCount = Object.keys(saved).length;
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const navRef = useRef(null);

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem('nav.collapsed', JSON.stringify([...next]));
      } catch {}
      return next;
    });

  // Trên điện thoại menu là ngăn kéo: Esc để đóng, mở ra thì đưa focus vào trang đang xem.
  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector('[aria-current="page"]')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const link = (n) => (
    <li key={n.id}>
      <a href={`#/${n.id}`} className="nav-link" aria-current={route === n.id ? 'page' : undefined}>
        <Icon name={n.id} />
        <span>{n.label}</span>
        {n.id === 'saved' && savedCount > 0 && <span className="nav-count">{savedCount}</span>}
      </a>
    </li>
  );

  return (
    <>
      <div className="nav-backdrop" data-open={open || undefined} onClick={onClose} aria-hidden="true" />
      <aside className="sidebar" data-open={open || undefined}>
        <a className="brand" href="#/">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M2 18h7l3-10 5 18 4-12 2 4h7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Mạch AI</span>
        </a>
        <nav aria-label="Mục chính" ref={navRef} className="nav-groups">
          {NAV_GROUPS.map((g) => {
            if (!g.label) {
              return (
                <ul key={g.id} className={`nav nav-${g.id}`}>
                  {g.items.map(link)}
                </ul>
              );
            }
            // Nhóm chứa trang đang xem luôn mở để không "mất" vị trí hiện tại.
            const active = g.items.some((n) => n.id === route);
            const isOpen = active || !collapsed.has(g.id);
            return (
              <div key={g.id} className="nav-group">
                <button
                  className="nav-group-btn"
                  aria-expanded={isOpen}
                  aria-controls={`nav-${g.id}`}
                  onClick={() => toggle(g.id)}
                  disabled={active}
                >
                  <span>{g.label}</span>
                  <svg className="nav-chevron" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <ul className="nav" id={`nav-${g.id}`}>
                    {g.items.map(link)}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <p className="sidebar-foot">
          Dữ liệu từ Hacker News, Lobsters, GitHub, NVD, các trang tin bảo mật, DEV, OpenRouter và Hugging Face. Tự cập
          nhật mỗi 15 phút.
        </p>
      </aside>
    </>
  );
}
