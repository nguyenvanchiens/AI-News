import { RepoCatalog, topics } from './Tools.jsx';

const MONEY_GROUPS = [
  {
    label: 'Tìm ý tưởng',
    items: [
      [
        'ideas',
        'Ý tưởng kinh doanh, indie hacker',
        topics('side-hustle', 'make-money', 'passive-income', 'indie-hacker', 'bootstrapping', 'startup-ideas'),
      ],
      ['freelance', 'Nhận việc freelance', topics('freelance', 'upwork', 'fiverr', 'remote-jobs')],
    ],
  },
  {
    label: 'Làm nội dung',
    items: [
      [
        'short-video',
        'Video ngắn tự động (YouTube, TikTok)',
        topics('youtube-automation', 'shorts-generator', 'faceless-video', 'tiktok-automation', 'short-video'),
        'YouTube và TikTok hạn chế kiếm tiền từ nội dung làm hàng loạt, lặp lại hoặc ít giá trị riêng. Công cụ giúp làm nhanh hơn, nhưng video vẫn cần ý tưởng và giá trị của bạn. Đọc chính sách kiếm tiền của nền tảng trước khi làm.',
      ],
      [
        'seo',
        'SEO, viết bài, marketing',
        topics('seo', 'content-marketing', 'ai-writer', 'blog-automation', 'copywriting', 'marketing-automation'),
        'Google coi việc tạo hàng loạt bài viết chủ yếu để kéo thứ hạng là spam và có thể hạ hạng cả trang. AI nên dùng để viết tốt hơn, không phải để viết nhiều hơn.',
      ],
      ['ecommerce', 'Bán hàng online', topics('print-on-demand', 'dropshipping', 'shopify-app', 'ecommerce-automation', 'product-description')],
    ],
  },
  {
    label: 'Làm sản phẩm, dịch vụ',
    items: [
      ['saas', 'Bộ khung dựng SaaS AI để bán', topics('saas-boilerplate', 'saas-starter', 'ai-saas', 'saas-template')],
      ['chatbot', 'Chatbot chăm sóc khách hàng', topics('chatbot-builder', 'customer-support', 'ai-customer-service', 'live-chat')],
      ['business-automation', 'Tự động hóa cho doanh nghiệp', topics('business-automation', 'workflow-automation', 'n8n', 'zapier-alternative')],
      [
        'leads',
        'Tìm khách hàng',
        topics('lead-generation', 'sales-automation', 'crm'),
        'Thu thập dữ liệu và nhắn tin hàng loạt có thể vi phạm điều khoản của nền tảng và luật bảo vệ dữ liệu cá nhân. Chỉ liên hệ người đã đồng ý nhận tin.',
      ],
      ['payments', 'Nhận thanh toán, bán bản quyền', topics('payments', 'stripe', 'subscription', 'license-key', 'paywall')],
    ],
  },
  {
    label: 'Đầu tư (rủi ro cao)',
    items: [
      [
        'trading',
        'Bot giao dịch, phân tích chứng khoán',
        topics('trading-bot', 'algorithmic-trading', 'quantitative-trading', 'stock-analysis'),
        'Bot giao dịch không đảm bảo lợi nhuận và có thể làm mất tiền rất nhanh. Chạy thử bằng tài khoản ảo (paper trading) trước. Cảnh giác với repo hứa lãi cao hoặc đòi khóa API có quyền rút tiền.',
      ],
    ],
  },
];

export function Money() {
  return (
    <RepoCatalog
      prefKey="money"
      title="Kiếm tiền với AI"
      description="Mã nguồn mở cho những hướng kiếm tiền phổ biến với AI: làm nội dung, bán sản phẩm, làm dịch vụ cho doanh nghiệp. Chọn một hướng hoặc tự tìm, gõ tiếng Việt cũng được."
      intro="Đây là công cụ, không phải công thức làm giàu. Thu nhập đến từ sản phẩm hữu ích và khách hàng thật; hãy cảnh giác với repo hoặc khóa học hứa hẹn thu nhập thụ động dễ dàng."
      groups={MONEY_GROUPS}
      placeholder="Ví dụ: bán khóa học online, đặt lịch cho spa"
    />
  );
}
