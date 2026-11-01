import { useState } from 'react';

export function PageHeader({ title, children, description }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {description && <p className="page-desc">{description}</p>}
      {children && <div className="filters">{children}</div>}
    </header>
  );
}

export function Chips({ label, options, value, onChange }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} className="chip" role="radio" aria-checked={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

// Nhớ lựa chọn bộ lọc của từng trang giữa các lần mở.
export function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem('pref:' + key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  const update = (v) => {
    setValue(v);
    try {
      localStorage.setItem('pref:' + key, JSON.stringify(v));
    } catch {}
  };
  return [value, update];
}
