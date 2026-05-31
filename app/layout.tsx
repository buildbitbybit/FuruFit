import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FuruFit — 超市棚自作シミュレーション',
  description: '年收入から控除上限を算出し、12ヶ月分の食料・水を均等配分するスマートツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}