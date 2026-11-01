import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cached } from './cache.js';

const AppContext = createContext(null);

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem('saved') || '{}');
  } catch {
    return {};
  }
}

export function AppProvider({ children }) {
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [saved, setSaved] = useState(loadSaved);

  const toggleSave = useCallback((item) => {
    setSaved((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = { ...item, savedAt: Date.now() };
      try {
        localStorage.setItem('saved', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Theo dõi các lần tải đang chạy để nút "Làm mới" biết khi nào xong.
  // Dùng ref vì effect của trang con chạy trước effect của Provider trong cùng một lần render.
  const inflight = useRef(0);
  const refreshStart = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const finishRefresh = useCallback(() => {
    if (!refreshStart.current) return;
    // Giữ hiệu ứng ít nhất 600ms để luôn thấy được là đã bấm.
    const wait = Math.max(0, 600 - (Date.now() - refreshStart.current));
    refreshStart.current = 0;
    setTimeout(() => {
      setRefreshing(false);
      setRefreshedAt(Date.now());
    }, wait);
  }, []);

  const track = useMemo(
    () => ({
      begin: () => inflight.current++,
      end: () => {
        inflight.current = Math.max(0, inflight.current - 1);
        if (inflight.current === 0) finishRefresh();
      },
    }),
    [finishRefresh],
  );

  const refresh = useCallback(() => {
    refreshStart.current = Date.now();
    setRefreshing(true);
    setTick((t) => t + 1);
  }, []);

  // Trang không có dữ liệu cần tải (ví dụ Đã lưu): kết thúc ngay sau lần render này.
  useEffect(() => {
    if (tick && inflight.current === 0) finishRefresh();
  }, [tick, finishRefresh]);

  const [vi, setViState] = useState(() => {
    try {
      return localStorage.getItem('pref:vi') !== 'false';
    } catch {
      return true;
    }
  });
  const toggleVi = useCallback(() => {
    setViState((v) => {
      try {
        localStorage.setItem('pref:vi', String(!v));
      } catch {}
      return !v;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ query, setQuery, tick, refresh, refreshing, refreshedAt, track, saved, toggleSave, vi, toggleVi }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

// Tải dữ liệu qua cache; bấm "Làm mới" (tick tăng) hoặc "Thử lại" thì bỏ qua cache.
export function useData([key, fetcher]) {
  const { tick, track } = useApp();
  const seen = useRef({ tick, retry: 0 });
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ items: null, error: null, stale: false, loading: true });

  useEffect(() => {
    let alive = true;
    const force = seen.current.tick !== tick || seen.current.retry !== retry;
    seen.current = { tick, retry };
    setState((s) => ({ ...s, loading: true, error: null }));
    track.begin();
    cached(key, fetcher, { force })
      .then((entry) => {
        if (alive) setState({ items: entry.v, error: entry.error || null, stale: !!entry.stale, loading: false });
      })
      .catch((error) => {
        if (alive) setState({ items: null, error, stale: false, loading: false });
      })
      .finally(track.end);
    return () => {
      alive = false;
    };
    // fetcher luôn đi kèm key, nên chỉ cần theo dõi key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick, retry]);

  return { ...state, retry: () => setRetry((r) => r + 1) };
}

export function useHashRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '') || 'overview';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
