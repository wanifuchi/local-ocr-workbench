# もじよみ - 開発継続ガイド

## サービス概要

画像やPDFをアップロードするとAI（Gemini Vision）がテキストを自動抽出し、Markdown形式で表示するWebアプリ。読み取り結果は履歴としてブラウザのlocalStorageに自動保存される。

## 本番URL

- **サイト**: https://local-ocr-workbench.vercel.app/
- **GitHub**: https://github.com/wanifuchi/local-ocr-workbench

## 元リポジトリ

https://github.com/stevibe/local-ocr-workbench をフォーク元として開発。
元はローカルOllama + glm-ocrで動作していたものを、Gemini Vision API + Vercelデプロイに改修した。

## 技術スタック

| 領域 | 技術 |
|---|---|
| フロントエンド | React 19 + Vite 8 + Tailwind CSS 3 |
| OCRバックエンド | Gemini Vision API (gemini-2.5-flash) |
| サーバーレス関数 | Vercel Serverless Functions (api/ocr.js) |
| ホスティング | Vercel |
| PDF処理 | pdfjs-dist |
| Markdown表示 | react-markdown + remark/rehype プラグイン + KaTeX |
| 履歴保存 | localStorage |
| ロゴフォント | Google Fonts - Yomogi（手書き風） |

## ディレクトリ構成

```
├── api/
│   └── ocr.js                  # Vercel Serverless Function（Gemini APIプロキシ）
├── src/
│   ├── components/
│   │   ├── DocumentPanel.jsx   # 画像/PDFアップロード・プレビュー
│   │   ├── HistoryPanel.jsx    # 履歴一覧・詳細表示
│   │   ├── ResultsPanel.jsx    # OCR結果のMarkdownレンダリング
│   │   └── SettingsModal.jsx   # モデル設定モーダル
│   ├── config/
│   │   └── ocr.js              # OCR設定管理・プロンプト定義
│   ├── lib/
│   │   ├── document.js         # PDF読み込み・Base64エンコード
│   │   ├── history.js          # 履歴CRUD（localStorage）
│   │   ├── markdown.js         # Markdownプラグイン設定
│   │   └── ocr-api.js          # Gemini APIへのリクエスト・SSEストリーミング処理
│   ├── App.jsx                 # メインコンポーネント（ページ切り替え・状態管理）
│   ├── main.jsx                # Reactエントリーポイント
│   └── index.css               # Tailwind + カスタムスタイル
├── index.html                  # HTMLエントリー（Yomogiフォント読み込み）
├── vercel.json                 # Vercelデプロイ設定
├── .env.example                # 環境変数テンプレート
├── .env                        # 実環境変数（Git管理外）
├── vite.config.js              # Vite設定
├── tailwind.config.js          # Tailwind設定
└── package.json                # 依存関係・スクリプト
```

## データフロー

```
ユーザー → 画像/PDFアップロード
  → (PDFの場合) pdfjs-distでページをPNG変換
  → Base64エンコード
  → POST /api/ocr (Vercel Serverless Function)
  → Gemini Vision API (SSEストリーミング)
  → フロントエンドでリアルタイムMarkdown表示
  → 完了時にlocalStorageへ履歴保存（サムネイル付き）
```

## 環境変数

| 変数名 | 用途 | 設定場所 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API認証キー | Vercelダッシュボード + .env |
| `VITE_OCR_MODEL` | デフォルトモデル名 | .env（任意） |

**注意**: `GEMINI_API_KEY` は `.env` と Vercel 環境変数に設定済み。Gitには含めないこと。

## 開発コマンド

```bash
npm install          # 依存関係インストール
npm run dev          # ローカル開発サーバー（Vite）
vercel dev           # Serverless Function含むローカル開発
npm run build        # 本番ビルド
npm run lint         # ESLint
npm run check        # lint + build
```

## デプロイ

```bash
git push origin main          # GitHubへプッシュ
vercel --prod --yes            # Vercel本番デプロイ
```

## 実装済み機能

- [x] 画像アップロード → OCR → Markdown表示
- [x] PDFアップロード → ページ送り → OCR
- [x] SSEストリーミングによるリアルタイム表示
- [x] OCR統計（文字数、TTFT）
- [x] モデル設定変更（SettingsModal、localStorage保存）
- [x] 履歴ページ（サムネイル付き、最大50件、localStorage保存）
- [x] 履歴の詳細表示・テキストコピー・個別削除・一括削除
- [x] UI全体の日本語化
- [x] ロゴにYomogiフォント適用

## 改修履歴

1. `f7101b5` - 元リポジトリ（Ollama + glm-ocr）
2. `4929c22` - Gemini Vision API + Vercelデプロイに改修
3. `325439b` - UI日本語化、サービス名「もじよみ」に変更
4. `dc5e911` - 履歴ページ追加（localStorage保存）
5. `dcbfe51` - ロゴにYomogiフォント適用
