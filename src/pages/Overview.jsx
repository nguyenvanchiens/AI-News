import { useMemo } from 'react';
import { queries } from '../lib/sources.js';
import { useData } from '../lib/store.jsx';
import { ItemList } from '../components/ItemList.jsx';
import { PulseStrip } from '../components/PulseStrip.jsx';

function Section({ title, to, state, limit = 6, brief = true, wide = false }) {
  return (
    <section className={wide ? 'section section-wide' : 'section'}>
      <div className="section-head">
        <h2>{title}</h2>
        <a href={`#/${to}`}>Xem tất cả</a>
      </div>
      <ItemList state={state} limit={limit} brief={brief} />
    </section>
  );
}

export function Overview() {
  const hn = useData(queries.hn('top', 7));
  const repos = useData(queries.repos('', 7));
  const trending = useData(queries.trending('daily', ''));
  const secNews = useData(queries.securityNews());
  const advisories = useData(queries.advisories('', 'critical'));
  const lobsters = useData(queries.lobsters(''));
  const articles = useData(queries.articles('programming'));
  const models = useData(queries.models(''));
  const llms = useData(queries.llms());
  const papers = useData(queries.papers());

  const all = [hn, repos, secNews, advisories, lobsters, articles, llms, models, papers];
  const pulseItems = useMemo(
    () => all.flatMap((s) => s.items || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    all.map((s) => s.items),
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1>Hôm nay có gì mới</h1>
        <p className="page-desc">
          Tin lập trình được bàn nhiều, repo mới nổi, lỗ hổng bảo mật vừa công bố và những gì đáng chú ý trong AI. Rê chuột
          hoặc chạm vào mạch để xem nhanh từng mục.
        </p>
      </header>

      <PulseStrip items={pulseItems} loading={all.some((s) => s.loading)} />

      <div className="sections">
        <Section title="Nổi bật trên Hacker News" to="news" state={hn} />
        <Section title="Đang thịnh hành trên GitHub" to="repos" state={trending} />
        <Section title="Tin bảo mật mới" to="security" state={secNews} />
        <Section title="Lỗ hổng nghiêm trọng trong thư viện" to="security" state={advisories} />
        <Section title="LLM mới ra mắt" to="llm" state={llms} />
        <Section title="Đang hot trên Lobsters" to="news" state={lobsters} />
        <Section title="Bài viết lập trình nổi bật" to="articles" state={articles} />
        <Section title="Mô hình mở đang được chú ý" to="models" state={models} />
        <Section title="Bài báo AI nhiều upvote" to="papers" state={papers} />
      </div>
    </div>
  );
}
