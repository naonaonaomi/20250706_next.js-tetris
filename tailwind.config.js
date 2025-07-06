/** @type {import('tailwindcss').Config} */
// Tailwind CSS の設定ファイル
// スタイルを適用するファイルパスと、テーマのカスタマイズを定義
module.exports = {
  // Tailwind CSS を適用するファイルパス
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // カスタムカラー定義（CSS変数を使用）
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
}