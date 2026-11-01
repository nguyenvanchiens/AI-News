import { useMemo } from 'react';
import { ECOSYSTEMS, HN_PRESETS, queries } from '../lib/sources.js';
import { useApp, useData } from '../lib/store.jsx';
import { ItemList } from '../components/ItemList.jsx';
import { Chips, PageHeader, usePersisted } from '../components/Page.jsx';

function HNFeed() {
  const [preset, setPreset] = usePersisted('news.preset', 'top');
  const [days, setDays] = usePersisted('news.days', 7);
  const key = HN_PRESETS[preset] ? preset : 'top';
  const state = useData(queries.hn(key, days));
  return (
    <>
      <div className="filters">
        <Chips label="Chủ đề" value={key} onChange={setPreset} options={Object.entries(HN_PRESETS).map(([k, p]) => [k, p.label])} />
        <Chips label="Khoảng thời gian" value={days} onChange={setDays} options={[[1, '24 giờ'], [7, '7 ngày'], [30, '30 ngày']]} />
      </div>
      <ItemList state={state} />
    </>
  );
}

function LobstersFeed() {
  const [tag, setTag] = usePersisted('news.lobsters', '');
  const state = useData(queries.lobsters(tag));
  return (
    <>
      <div className="filters">
        <Chips
          label="Thẻ"
          value={tag}
          onChange={setTag}
          options={[['', 'Đang hot'], ['programming', 'Lập trình'], ['security', 'Bảo mật'], ['web', 'Web'], ['rust', 'Rust'], ['go', 'Go'], ['devops', 'DevOps'], ['databases', 'Cơ sở dữ liệu'], ['ai', 'AI']]}
        />
      </div>
      <ItemList state={state} />
    </>
  );
}

export function News() {
  const [source, setSource] = usePersisted('news.source', 'hn');
  return (
    <div className="page">
      <PageHeader
        title="Tin lập trình"
        description="Câu chuyện lập trình viên đang bàn luận: dự án mới, công cụ, kinh nghiệm làm nghề và những gì đang thay đổi trong ngành."
      >
        <Chips label="Nguồn" value={source} onChange={setSource} options={[['hn', 'Hacker News'], ['lobsters', 'Lobsters']]} />
      </PageHeader>
      {source === 'lobsters' ? <LobstersFeed /> : <HNFeed />}
    </div>
  );
}

function AdvisoryFeed() {
  const [ecosystem, setEcosystem] = usePersisted('security.ecosystem', '');
  const [severity, setSeverity] = usePersisted('security.severity', '');
  const state = useData(queries.advisories(ecosystem, severity));
  return (
    <>
      <div className="filters">
        <Chips label="Hệ sinh thái" value={ecosystem} onChange={setEcosystem} options={[['', 'Tất cả'], ...Object.entries(ECOSYSTEMS)]} />
        <Chips label="Mức độ" value={severity} onChange={setSeverity} options={[['', 'Mọi mức'], ['critical', 'Nghiêm trọng'], ['high', 'Cao'], ['medium', 'Trung bình']]} />
      </div>
      <ItemList state={state} />
    </>
  );
}

function SecurityNewsFeed() {
  return <ItemList state={useData(queries.securityNews())} />;
}

function CVEFeed() {
  return <ItemList state={useData(queries.cves())} />;
}

const SECURITY_TABS = {
  news: { label: 'Tin bảo mật', desc: 'Tin mới nhất từ The Hacker News, BleepingComputer và Krebs on Security.', Feed: SecurityNewsFeed },
  advisories: {
    label: 'Lỗ hổng thư viện',
    desc: 'Lỗ hổng trong thư viện mã nguồn mở đã được GitHub xác minh, kèm phiên bản bị ảnh hưởng và bản vá. Kiểm tra xem dự án của bạn có dùng không.',
    Feed: AdvisoryFeed,
  },
  cves: { label: 'CVE nghiêm trọng', desc: 'CVE có điểm CVSS từ 9.0 trở lên được công bố trong 7 ngày qua, lấy từ NVD.', Feed: CVEFeed },
};

export function Security() {
  const [tab, setTab] = usePersisted('security.tab', 'news');
  const current = SECURITY_TABS[tab] || SECURITY_TABS.news;
  return (
    <div className="page">
      <PageHeader title="Bảo mật" description={current.desc}>
        <Chips label="Loại tin" value={tab} onChange={setTab} options={Object.entries(SECURITY_TABS).map(([k, t]) => [k, t.label])} />
      </PageHeader>
      <current.Feed />
    </div>
  );
}

const REPO_TOPICS = [
  ['', 'Mọi chủ đề'],
  ['developer-tools', 'Công cụ dev'],
  ['cli', 'CLI'],
  ['terminal', 'Terminal'],
  ['self-hosted', 'Tự host'],
  ['claude-code', 'Claude Code'],
  ['coding-agent', 'Coding agent'],
  ['mcp', 'MCP'],
  ['llm', 'LLM'],
];

function TrendingRepos() {
  const [since, setSince] = usePersisted('repos.trending.since', 'daily');
  const [language, setLanguage] = usePersisted('repos.trending.language', '');
  const state = useData(queries.trending(since, language));
  return (
    <>
      <div className="filters">
        <Chips label="Khoảng thời gian" value={since} onChange={setSince} options={[['daily', 'Hôm nay'], ['weekly', 'Tuần này'], ['monthly', 'Tháng này']]} />
        <Chips
          label="Ngôn ngữ"
          value={language}
          onChange={setLanguage}
          options={[['', 'Mọi ngôn ngữ'], ['python', 'Python'], ['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['go', 'Go'], ['rust', 'Rust'], ['java', 'Java'], ['c++', 'C++']]}
        />
      </div>
      <ItemList state={state} showCost />
    </>
  );
}

function NewRepos() {
  const [topic, setTopic] = usePersisted('repos.dev-topic', '');
  const [days, setDays] = usePersisted('repos.days', 7);
  const state = useData(queries.repos(topic, days));
  return (
    <>
      <div className="filters">
        <Chips label="Chủ đề" value={topic} onChange={setTopic} options={REPO_TOPICS} />
        <Chips label="Tạo trong" value={days} onChange={setDays} options={[[7, '7 ngày'], [30, '30 ngày'], [90, '3 tháng']]} />
      </div>
      <ItemList state={state} showCost />
    </>
  );
}

function FamousRepos() {
  const [topic, setTopic] = usePersisted('repos.famous.topic', '');
  const state = useData(queries.famousRepos(topic));
  return (
    <>
      <div className="filters">
        <Chips label="Chủ đề" value={topic} onChange={setTopic} options={REPO_TOPICS} />
      </div>
      <ItemList state={state} showCost />
    </>
  );
}

const REPO_MODES = {
  trending: {
    label: 'Đang thịnh hành',
    desc: 'Repo đang tăng sao nhanh nhất, cả dự án lâu năm lẫn mới ra, giống trang GitHub Trending. Số lớn bên phải là số sao tăng trong khoảng thời gian đã chọn.',
    Feed: TrendingRepos,
  },
  new: {
    label: 'Mới nổi',
    desc: 'Chỉ gồm repo mới tạo trong khoảng thời gian đã chọn, xếp theo số sao. Hợp để phát hiện dự án mới trước khi chúng nổi tiếng.',
    Feed: NewRepos,
  },
  famous: {
    label: 'Nổi tiếng nhất',
    desc: 'Repo nhiều sao nhất mọi thời đại. Mục "Mọi chủ đề" hiện các repo trên 50k sao; chọn chủ đề để xem repo hàng đầu của chủ đề đó.',
    Feed: FamousRepos,
  },
};

export function Repos() {
  const [mode, setMode] = usePersisted('repos.mode', 'trending');
  const current = REPO_MODES[mode] || REPO_MODES.trending;
  return (
    <div className="page">
      <PageHeader title="Repo GitHub" description={current.desc}>
        <Chips label="Chế độ" value={mode} onChange={setMode} options={Object.entries(REPO_MODES).map(([k, m]) => [k, m.label])} />
      </PageHeader>
      <current.Feed />
    </div>
  );
}

export function Articles() {
  const [tag, setTag] = usePersisted('articles.dev-tag', 'programming');
  const state = useData(queries.articles(tag));
  return (
    <div className="page">
      <PageHeader title="Bài viết" description="Bài hướng dẫn và chia sẻ kinh nghiệm được yêu thích nhất trên DEV trong tuần.">
        <Chips
          label="Thẻ"
          value={tag}
          onChange={setTag}
          options={[
            ['programming', 'Lập trình'],
            ['webdev', 'Web'],
            ['javascript', 'JavaScript'],
            ['python', 'Python'],
            ['devops', 'DevOps'],
            ['security', 'Bảo mật'],
            ['ai', 'AI'],
            ['career', 'Nghề nghiệp'],
          ]}
        />
      </PageHeader>
      <ItemList state={state} />
    </div>
  );
}

export function Models() {
  const [pipeline, setPipeline] = usePersisted('models.pipeline', '');
  const state = useData(queries.models(pipeline));
  return (
    <div className="page">
      <PageHeader title="Mô hình mở" description="Mô hình đang thịnh hành trên Hugging Face, xếp theo độ hot trong vài ngày gần đây.">
        <Chips
          label="Loại mô hình"
          value={pipeline}
          onChange={setPipeline}
          options={[
            ['', 'Tất cả'],
            ['text-generation', 'Sinh văn bản'],
            ['image-text-to-text', 'Hiểu ảnh'],
            ['text-to-image', 'Tạo ảnh'],
            ['text-to-video', 'Tạo video'],
            ['text-to-speech', 'Giọng nói'],
            ['automatic-speech-recognition', 'Nhận dạng giọng nói'],
          ]}
        />
      </PageHeader>
      <ItemList state={state} />
    </div>
  );
}

export function Papers() {
  const [sort, setSort] = usePersisted('papers.sort', 'votes');
  const raw = useData(queries.papers());
  const state = useMemo(() => {
    if (!raw.items || sort === 'votes') return raw;
    return { ...raw, items: [...raw.items].sort((a, b) => b.time - a.time) };
  }, [raw, sort]);
  return (
    <div className="page">
      <PageHeader title="Bài báo" description="Bài báo nghiên cứu được cộng đồng Hugging Face chọn mỗi ngày, kèm tóm tắt ngắn.">
        <Chips label="Sắp xếp" value={sort} onChange={setSort} options={[['votes', 'Nhiều upvote'], ['new', 'Mới nhất']]} />
      </PageHeader>
      <ItemList state={state} />
    </div>
  );
}

export function Saved() {
  const { saved } = useApp();
  const items = Object.values(saved).sort((a, b) => b.savedAt - a.savedAt);
  return (
    <div className="page">
      <PageHeader title="Đã lưu" description="Những mục bạn đánh dấu để đọc sau. Danh sách lưu trên trình duyệt này." />
      {items.length === 0 ? (
        <p className="empty">Chưa lưu mục nào. Bấm biểu tượng dấu trang ở bên phải một mục bất kỳ để lưu lại đọc sau.</p>
      ) : (
        <ItemList state={{ items, loading: false }} />
      )}
    </div>
  );
}
