# tk_comfyui_view_and_light

**Language / 语言 / 言語 / 언어:** [English](README.md) | [中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

3Dカメラアングル制御用のComfyUIカスタムノード。インタラクティブなThree.jsビューポートでカメラアングルを調整し、マルチアングル画像生成用のフォーマット済みプロンプト文字列を出力します。
![img.png](img.png)
## 機能

- **インタラクティブな3Dカメラ制御** - Three.jsビューポートでハンドルをドラッグして調整：
  - 水平角度（アジマス）：0° - 360°
  - 垂直角度（エレベーション）：-30°から60°
  - ズームレベル：0 - 10
- **クイック選択ドロップダウン** - プリセットカメラアングルを素早く選択するための3つのドロップダウンメニュー：
  - アジマス：正面、クォータービュー、サイドビュー、背面
  - エレベーション：ローアングル、アイレベル、ハイアングル、俯瞰
  - 距離：ワイドショット、ミディアムショット、クローズアップ
- **リアルタイムプレビュー** - 画像入力を接続すると、正確なカラーレンダリングでカードとして3Dシーンに表示
- **カメラビューモード** - `camera_view`を切り替えてカメラインジケーターの視点からシーンをプレビュー、インタラクティブなオービット制御対応（ドラッグで回転、スクロールでズーム）
- **プロンプト出力** - [Qwen-Image-Edit-2511-Multiple-Angles-LoRA](https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA)と互換性のあるフォーマット済みプロンプトを出力
- **双方向同期** - スライダーウィジェット、3Dハンドル、ドロップダウンが同期を維持
- **多言語サポート** - UIラベルは英語、中国語、日本語、韓国語で利用可能（ComfyUI設定から自動検出）

## インストール

1. ComfyUIカスタムノードフォルダに移動：
   ```bash
   cd ComfyUI/custom_nodes
   ```

2. このリポジトリをクローン：
   ```bash
   git clone https://github.com/jtydhr88/ComfyUI-qwenmultiangle.git
   ```

3. ComfyUIを再起動

4. https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA/tree/main からLoRAをダウンロードしてloraフォルダに配置

## 開発

このプロジェクトはフロントエンドの構築にTypeScriptとViteを使用しています。3DビューポートはThree.jsで構築されています。

### 前提条件

- Node.js 18+
- npm

### ビルド

```bash
# 依存関係をインストール
npm install

# 本番用ビルド
npm run build

# ウォッチモードでビルド（開発用）
npm run dev

# 型チェック
npm run typecheck
```

### プロジェクト構造

```
ComfyUI-qwenmultiangle/
├── src/
│   ├── main.ts           # エクステンションエントリーポイント
│   ├── CameraWidget.ts   # Three.jsカメラ制御ウィジェット
│   ├── i18n.ts           # 国際化 (en/zh/ja/ko)
│   ├── styles.ts         # CSSスタイル
│   └── types.ts          # TypeScript型定義
├── js/                   # ビルド出力（配布用にコミット済み）
│   └── main.js
├── nodes.py              # ComfyUIノード定義
├── __init__.py           # Pythonモジュール初期化
├── package.json
├── tsconfig.json
└── vite.config.mts
```

## 使用方法

1. `image/multiangle`カテゴリから**Qwen Multiangle Camera**ノードを追加
2. オプション：3Dシーンでプレビューするために画像入力を接続
3. 以下の方法でカメラアングルを調整：
   - 3Dビューポートでカラーハンドルをドラッグ
   - スライダーウィジェットを使用
   - ドロップダウンメニューからプリセット値を選択
4. `camera_view`を切り替えてカメラの視点からプレビューを確認
5. ノードはカメラアングルを説明するプロンプト文字列を出力

### ウィジェット

| ウィジェット | タイプ | 説明 |
|-------------|--------|------|
| horizontal_angle | スライダー | カメラアジマス角度 (0° - 360°) |
| vertical_angle | スライダー | カメラエレベーション角度 (-30°から60°) |
| zoom | スライダー | カメラ距離/ズームレベル (0 - 10) |
| default_prompts | チェックボックス | **非推奨** - 後方互換性のためのみ保持、効果なし |
| camera_view | チェックボックス | カメラの視点からシーンをプレビュー |

### 3Dビューポート制御

| ハンドル | 色 | 制御 |
|----------|-----|------|
| リングハンドル | ピンク | 水平角度（アジマス） |
| アークハンドル | シアン | 垂直角度（エレベーション） |
| ラインハンドル | ゴールド | ズーム/距離 |

画像プレビューはカードとして表示されます - 正面は画像を表示し、背面から見るとグリッドパターンが表示されます。

### カメラビューモード制御

`camera_view`が有効な場合、マウスでカメラをインタラクティブに制御できます：

| アクション | 制御 |
|------------|------|
| 左右ドラッグ | 水平回転（アジマス） |
| 上下ドラッグ | 垂直回転（エレベーション） |
| 上スクロール | ズームイン（距離増加） |
| 下スクロール | ズームアウト（距離減少） |

すべての操作はスライダーと同じ制限を遵守します：
- アジマス：0° - 360°（ループ）
- エレベーション：-30°から60°
- 距離：0 - 10

オービット制御による変更は自動的にスライダーウィジェットと同期されます。

### クイック選択ドロップダウン

3Dビューポートには、プリセットカメラアングルを素早く選択するための3つのドロップダウンメニューがあります：

| ドロップダウン | オプション |
|---------------|-----------|
| 水平 (H) | 正面、右前方、右側面、右後方、背面、左後方、左側面、左前方 |
| 垂直 (V) | ローアングル、アイレベル、ハイアングル、俯瞰 |
| 距離 (Z) | ワイドショット、ミディアムショット、クローズアップ |

プリセットを選択すると、3Dハンドルとスライダーウィジェットが自動的に更新されます。

### 国際化

UIラベルはComfyUIの言語設定に基づいて自動的に翻訳されます：

| 言語 | コード |
|------|--------|
| 英語 | en |
| 中国語（簡体字） | zh |
| 日本語 | ja |
| 韓国語 | ko |

UI言語に関係なく、出力プロンプトは常に英語です。

### 出力プロンプト形式

ノードは[Qwen-Image-Edit-2511-Multiple-Angles-LoRA](https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA)が必要とする形式でプロンプトを出力します：

```
<sks> {アジマス} {エレベーション} {距離}
```

例：
- `<sks> front view eye-level shot medium shot`
- `<sks> right side view high-angle shot close-up`
- `<sks> back-left quarter view low-angle shot wide shot`

#### サポートされる値

| パラメータ | 値 |
|-----------|-----|
| アジマス | `front view`、`front-right quarter view`、`right side view`、`back-right quarter view`、`back view`、`back-left quarter view`、`left side view`、`front-left quarter view` |
| エレベーション | `low-angle shot` (-30°)、`eye-level shot` (0°)、`elevated shot` (30°)、`high-angle shot` (60°) |
| 距離 | `close-up`、`medium shot`、`wide shot` |

## クレジット

### オリジナル実装

このComfyUIノードは[qwenmultiangle](https://github.com/amrrs/qwenmultiangle)（スタンドアロンのカメラアングル制御Webアプリケーション）をベースにしています。

オリジナルプロジェクトは以下からインスピレーションを受けています：
- Hugging Face Spacesの[multimodalart/qwen-image-multiple-angles-3d-camera](https://huggingface.co/spaces/multimodalart/qwen-image-multiple-angles-3d-camera)
- [fal.ai - Qwen Image Edit 2511 Multiple Angles](https://fal.ai/models/fal-ai/qwen-image-edit-2511-multiple-angles/)

## 関連プロジェクト

- [ComfyUI-qwenmultiangle-plus](https://github.com/cjlang2020/ComfyUI-qwenmultiangle-plus) - このプロジェクトをベースにした別の改良版

## ライセンス

MIT
