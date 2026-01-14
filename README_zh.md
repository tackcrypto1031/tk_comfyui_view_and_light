# TK View & Light

這是一個專業的 ComfyUI 節點，提供互動式 3D 小部件來控制攝影機角度和燈光方向。本工具旨在幫助創作者輕鬆視覺化並生成精確的提示詞（Prompts），用於具備 3D 感知的圖像生成。

![預覽圖](https://github.com/tackcrypto1031/tk_comfyui_view_and_light/blob/main/sample/sample.png)
![預覽圖](https://github.com/tackcrypto1031/tk_comfyui_view_and_light/blob/main/sample/sample2.png)

## 🚀 核心功能

- **互動式 3D 小部件**：使用 Three.js 驅動的即時 3D 視窗，視覺化攝影機與光源位置。
- **精確攝影機控制**：可調整水平角度 (0-360°)、垂直角度 (-90 到 90°) 以及縮放倍率（Zoom）。
- **動態燈光控制**：可開啟/關閉燈光、調整光源方向，並透過內建顏色選擇器自訂燈光顏色。
- **雙重提示詞輸出**：自動生成兩個獨立的提示詞：
  - `camera_prompt`：詳細的攝影機位置（例如："front-right quarter view, eye-level shot, medium shot"）。
  - `light_prompt`：詳細的燈光描述（例如："(light source from the Right Front, High), #FFFFFF colored light"）。
- **即時視覺回饋**：3D 場景會根據您的輸入即時更新。

## 🛠️ 安裝方法

### 方法 1：使用 ComfyUI-Manager (推薦)
1. 在 ComfyUI-Manager 中搜尋 `TK View & Light`。
2. 點擊 **Install**。
3. 重啟 ComfyUI。

### 方法 2：使用 Git Clone
1. 進入您 ComfyUI 的 `custom_nodes` 目錄。
2. 複製此倉庫：
   ```bash
   git clone https://github.com/Tack1031/tk_comfyui_view_and_light.git
   ```
3. 重啟 ComfyUI。

## 📖 使用說明

1. 新增 **TK View & Light** 節點（位於 `TK Nodes` 分類下）。
2. 直接使用拉桿或 **3D 小部件** 進行調整：
   - **左鍵點擊並拖拽**：調整攝影機視角。
   - **點擊 "Light Mode"**：切換至燈光模式以調整光源位置。
3. 將 `camera_prompt` 與 `light_prompt` 輸出連接至您的文本編碼器（Text Encoder）或提示詞合併節點。
4. (選用) 可連接輸入 `image`，圖像將反射在 3D 小部件的背景或參考平面上。

## 🙏 特別鳴謝

感謝以下開源專案提供的技術支援與靈感：
- [ComfyUI-qwenmultiangle](https://github.com/jtydhr88/ComfyUI-qwenmultiangle) - 提供多角度攝影機提示詞邏輯技術。
- [ComfyUI-AdvancedCameraPrompts](https://github.com/jandan520/ComfyUI-AdvancedCameraPrompts) - 提供進階攝影機控制技術。

## ✉️ 聯絡資訊

- **作者**: Tack
- **電子郵件**: [tack1031@gmail.com](mailto:tack1031@gmail.com)

## 📄 開源協議

本專案採用 **MIT 協議** 開源。詳情請參閱 [LICENSE](LICENSE) 文件。
