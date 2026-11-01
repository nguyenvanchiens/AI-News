import { useCallback, useEffect, useState } from 'react';
import { useHashRoute } from './lib/store.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { Overview } from './pages/Overview.jsx';
import { Articles, Models, News, Papers, Repos, Saved, Security } from './pages/Feeds.jsx';
import { LLM } from './pages/LLM.jsx';
import { Tools } from './pages/Tools.jsx';
import { Money } from './pages/Money.jsx';

const PAGES = {
  overview: Overview,
  news: News,
  security: Security,
  articles: Articles,
  repos: Repos,
  tools: Tools,
  money: Money,
  llm: LLM,
  models: Models,
  papers: Papers,
  saved: Saved,
};

export default function App() {
  const route = useHashRoute();
  const current = PAGES[route] ? route : 'overview';
  const Page = PAGES[current];
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Chọn trang xong thì đóng menu trên điện thoại.
  useEffect(() => setNavOpen(false), [route]);

  return (
    <div className="app">
      <Sidebar route={current} open={navOpen} onClose={closeNav} />
      <div className="main">
        <Topbar route={current} onOpenNav={() => setNavOpen(true)} />
        <main>
          <Page />
        </main>
      </div>
    </div>
  );
}
