const paths = {
  overview: 'M3 13h4l2-6 4 12 3-9 2 3h3',
  news: 'M5 5h11v14H6a1 1 0 0 1-1-1V5Zm11 4h3v9a1 1 0 0 1-1 1h-2M8 9h5M8 12h5M8 15h3',
  repos: 'M6 4h10l3 3v13H6zM9 9l-2 2 2 2M14 9l2 2-2 2',
  models: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5',
  papers: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 15h5M10 18h3',
  articles: 'M4 6h16M4 11h16M4 16h10',
  saved: 'M7 4h10v17l-5-4-5 4z',
  money: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm3 6c-.5-.9-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.1 0 2.9 6 1.6 6 4.6 0 1.2-1.3 2.3-3 2.3-1.4 0-2.6-.6-3.1-1.6M12 6v1.5M12 16.5V18',
  menu:'M4 6h16M4 12h16M4 18h16',
  llm: 'M4 5h16v11H9l-5 4V5Zm4 4h8M8 12h5',
  tools:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7',
  translate:'M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5 7M11 5c-.7 3.5-3 6.5-6 8M13 21l4-9 4 9M14.5 18h5',
  security:'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Zm-3 9 2 2 4-4',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm5 12 4 4',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
  sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
};

export function Icon({ name, size = 18, filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
