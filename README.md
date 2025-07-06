# Next.js テトリスゲーム

Next.js 14 (App Router) で構築された認証機能付きフルスタックテトリスゲームです。

## 機能

- **認証機能**: NextAuth.js を使用した Google OAuth ログイン
- **テトリスゲーム**: React フックを使用したフル機能テトリス実装
- **スコア記録**: ハイスコアの保存と閲覧
- **レスポンシブデザイン**: Tailwind CSS によるモバイルフレンドリーなインターフェース
- **リアルタイムランキング**: メールアドレスをマスクした上位10位のリーダーボード

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, Tailwind CSS
- **認証**: NextAuth.js (Google OAuth)
- **データベース**: Prisma + PostgreSQL
- **デプロイ**: Vercel 対応

## セットアップ

### 前提条件

- Node.js 18+ 
- PostgreSQL データベース（ローカルまたは PlanetScale などのクラウド）
- Google OAuth 認証情報

### インストール

1. リポジトリのクローン:
```bash
git clone <repository-url>
cd nextjs-tetris
```

2. 依存関係のインストール:
```bash
npm install
```

3. 環境変数の設定:
```bash
cp .env.example .env
```

環境変数を設定してください:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tetris_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. データベースのセットアップ:
```bash
npx prisma db push
# または開発環境でマイグレーションを使用する場合
npx prisma migrate dev
```

5. Prisma クライアントの生成:
```bash
npx prisma generate
```

6. 開発サーバーの起動:
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## ゲーム操作

- **← →**: ピースを左右に移動
- **↓**: ソフトドロップ（落下速度を上げる）
- **↑**: ピースを回転
- **Space**: ハードドロップ（瞬間落下）
- **P**: ゲームの一時停止/再開

## API ルート

- `GET /api/score`: 上位10スコアの取得
- `POST /api/score`: 新しいスコアの保存（認証必須）
- `GET|POST /api/auth/[...nextauth]`: NextAuth.js エンドポイント

## データベーススキーマ

- **User**: id, name, email, image (NextAuth.js 標準)
- **Score**: id, userId, points, createdAt
- **Account/Session**: NextAuth.js テーブル

## デプロイ

### Vercel

1. コードを GitHub にプッシュ
2. リポジトリを Vercel に接続
3. Vercel ダッシュボードで環境変数を設定
4. デプロイ！

### データベースのセットアップ

本番環境では以下のようなクラウドデータベースを使用してください:
- PlanetScale（推奨）
- Railway
- Supabase
- AWS RDS

## 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 接続文字列 | はい |
| `NEXTAUTH_URL` | アプリケーションの URL | はい |
| `NEXTAUTH_SECRET` | NextAuth.js のランダムシークレット | はい |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアント ID | はい |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | はい |

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   ├── play/              # ゲームページ
│   ├── ranking/           # ランキングページ
│   └── globals.css        # グローバルスタイル
├── components/            # React コンポーネント
│   ├── TetrisGame.tsx    # メインゲームコンポーネント
│   └── SessionProvider.tsx
├── lib/                   # ユーティリティ
│   ├── auth.ts           # NextAuth.js 設定
│   └── prisma.ts         # データベースクライアント
└── types/                 # TypeScript 型定義
```

## ライセンス

MIT ライセンス - 学習や個人利用に自由にご使用ください。