# EmoGo - 情緒追蹤應用程式

## 📱 App URI
**Expo.dev Build URL**: https://expo.dev/accounts/rulai/projects/emogo-frontend-ru-lai/builds/e7a07a75-8307-4a54-90be-089814813788

**Expo Development URL**: `exp://192.168.50.64:8092`

**GitHub Repository**: https://github.com/ntu-info/emogo-frontend-ru-lai

## 📖 Project Description
EmoGo 是一個完整的情緒追蹤應用程式，結合了：
- 🎯 情緒記錄 (5 種情緒等級)
- 📹 1秒 vlog 自動錄製
- 📍 GPS 位置追蹤
- 🔔 每日 3 次通知提醒
- 📤 數據匯出功能
- 📊 完整統計分析

## 🚀 技術規格
- **Framework**: React Native with Expo 54.0.1
- **Camera**: expo-camera ~17.0.9
- **Location**: expo-location ^19.0.7
- **Notifications**: expo-notifications ^0.32.13
- **File System**: expo-file-system ^19.0.19
- **Media Library**: expo-media-library ~18.2.0
- **Sharing**: expo-sharing ~14.0.7

## 📦 安裝與運行

1. 安裝依賴套件:
   ```bash
   npm install
   ```

2. 啟動開發伺服器:
   ```bash
   npx expo start --go --port 8087
   ```

3. 用手機掃描 QR code 或在 Expo Go 中輸入 URI

## 🔔 功能說明

### 主要功能
- **情緒記錄**: 點擊表情符號記錄當下心情
- **自動 vlog**: 每次情緒記錄自動拍攝 1 秒影片
- **GPS 追蹤**: 同時記錄當下的精確位置
- **通知提醒**: 每日 9:00、14:00、20:00 自動提醒
- **數據匯出**: 符合作業要求的結構化數據匯出

### 使用流程
1. 🔔 設定每日提醒 (允許通知權限)
2. 📱 收到通知時點擊進入應用程式
3. 😊 點擊表情符號記錄心情
4. 📹 系統自動錄製 1 秒 vlog
5. 📍 同時記錄 GPS 位置
6. 📤 累積足夠數據後匯出

## 📊 作業要求滿足
- ✅ [1] App URI 已列在此 README
- ✅ [2] 完整 RN 源代碼 + AI 互動歷史
- 🔄 [3] Data folder (需要 3+ 筆記錄，時間跨度 >12 小時)

## 📝 開發者
- 學生: Ru Lai
- 課程: NTU INFO
- 項目: EmoGo Frontend
- 日期: 2025年11月27日
