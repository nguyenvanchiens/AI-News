import { useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { Icon } from './Icon.jsx';
import { pageLabel } from './Sidebar.jsx';

const today = new Intl.DateTimeFormat('vi', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function Topbar({ route, onOpenNav }) {
  const { query, setQuery, refresh, vi, toggleVi } = useApp();
  const [theme, setTheme] = useState(currentTheme);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    setTheme(next);
  };

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onOpenNav} aria-label={`Mở menu. Đang xem: ${pageLabel(route)}`}>
        <Icon name="menu" />
        <span>{pageLabel(route)}</span>
      </button>
      <p className="today">{today}</p>
      <label className="search">
        <Icon name="search" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lọc theo từ khóa"
          aria-label="Lọc theo từ khóa"
        />
      </label>
      <button
        className="icon-btn lang-btn"
        onClick={toggleVi}
        aria-pressed={vi}
        title={vi ? 'Đang dịch sang tiếng Việt. Bấm để xem bản gốc tiếng Anh' : 'Bấm để dịch tiêu đề và tóm tắt sang tiếng Việt'}
      >
        <Icon name="translate" />
        <span className="icon-btn-text">Tiếng Việt</span>
      </button>
      <button className="icon-btn" onClick={refresh} title="Tải lại dữ liệu mới nhất">
        <Icon name="refresh" />
        <span className="icon-btn-text">Làm mới</span>
      </button>
      <button
        className="icon-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
    </header>
  );
}
