# Human-AI Interaction History

## 🤖 EmoGo 應用程式開發過程

### 開發日期: 2025年11月27日
### 學生: Ru Lai  
### 課程: NTU INFO
### 專案: EmoGo Frontend - 情緒追蹤應用程式

---

## 📋 開發階段記錄

### Phase 1: 基礎應用程式架構 (初期)
- **人類需求**: 建立基本的情緒記錄應用程式
- **AI 協助**: 
  - 設計 React Native + Expo 架構
  - 建立基本 UI 和情緒選擇介面
  - 實作 5 種情緒等級系統 (😢😐🙂😊)
  - 基本的狀態管理和數據存儲

### Phase 2: GPS 位置追蹤整合
- **人類需求**: "同時紀錄當下的位置"
- **AI 協助**:
  - 整合 expo-location ^19.0.7
  - 實作 getCurrentLocation() 函數
  - 處理位置權限請求
  - 在情緒記錄中同時儲存 GPS 座標
  - 錯誤處理和權限管理

### Phase 3: 每日通知系統
- **人類需求**: 提供每日提醒功能
- **AI 協助**:
  - 整合 expo-notifications ^0.32.13
  - 實作每日 3 次定時通知 (9:00, 14:00, 20:00)
  - 通知權限處理
  - 背景通知排程設定
  - 用戶友好的通知設定介面

### Phase 4: Vlog 錄製功能
- **人類需求**: 每次情緒記錄時自動拍攝 1 秒影片
- **AI 協助**:
  - 整合 expo-camera ~17.0.9
  - 實作自動 vlog 錄製 (1秒限制)
  - 倒數計時 UI 設計
  - 影片保存到媒體庫
  - 前置攝像頭使用 (自拍模式)

### Phase 5: 依賴衝突解決
- **技術挑戰**: expo-router 依賴衝突導致 Build 失敗
- **AI 協助**:
  - 診斷 expo-router 版本衝突問題
  - 完全移除 expo-router 相關依賴
  - 重構為單檔案 App.js 架構
  - 清理 package.json 和 app.json
  - 使用 expo-doctor 驗證專案健康度

### Phase 6: EAS Build 系統配置
- **人類需求**: "那現在幫我用EAS build" - 創建生產版本
- **AI 協助**:
  - 配置 eas.json 建置設定檔
  - 成功建立 Android preview build
  - 生成 Expo.dev 分享連結
  - 更新 README.md 包含 App URI
  - 處理建置過程中的各種錯誤

### Phase 7: 數據持久化改進
- **技術問題**: "但我剛剛紀錄又不見了" - 數據遺失問題
- **AI 協助**:
  - 整合 @react-native-async-storage/async-storage
  - 實作本地數據持久化
  - 自動載入存儲數據
  - 數據自動保存機制
  - 解決數據遺失問題

### Phase 8: 服務器連接問題排除
- **技術問題**: "could not connect the server" - 連接問題
- **AI 協助**:
  - 診斷開發服務器連接問題
  - 多次重啟並清除緩存
  - 變更端口避免衝突 (8082→8084→8086→8087→8092→8093→8095)
  - 系統性的故障排除流程

### Phase 9: API 更新和修復
- **技術問題**: FileSystem API deprecation 警告
- **AI 協助**:
  - 識別 expo-file-system API 變更
  - 更新 import 從 'expo-file-system' 到 'expo-file-system/legacy'
  - 確保向後相容性
  - 解決 SDK 54 相關警告

### Phase 10: 數據匯出功能完善
- **人類需求**: 準備作業提交的數據匯出
- **AI 協助**:
  - 實作完整的 exportData() 功能
  - 數據驗證系統 (3+ 記錄, >12 小時跨度)
  - 結構化 JSON 匯出格式
  - 統計分析和 metadata 生成
  - 檔案分享整合

---

## 🚀 最終應用程式功能

### 核心功能清單:
1. **情緒記錄** - 5 級情緒選擇系統
2. **1秒 Vlog** - 自動前置攝像頭錄製
3. **GPS 追蹤** - 精確位置記錄
4. **每日通知** - 3 次定時提醒 (9:00, 14:00, 20:00)
5. **數據匯出** - 符合作業要求的結構化匯出
6. **本地存儲** - AsyncStorage 數據持久化
7. **統計分析** - 即時數據統計和視覺化

### 技術架構:
- **Framework**: React Native with Expo 54.0.1
- **Architecture**: Single App.js (simplified, stable)
- **Storage**: AsyncStorage for persistence
- **Camera**: expo-camera for vlog recording
- **Location**: expo-location for GPS tracking
- **Notifications**: expo-notifications for daily reminders
- **Build**: EAS Build system for production

### 開發挑戰與解決:
1. **依賴衝突** → 簡化架構，移除 expo-router
2. **數據遺失** → 整合 AsyncStorage 持久化
3. **連接問題** → 系統性服務器重啟和緩存清理
4. **API 變更** → 及時更新到 legacy FileSystem API
5. **權限管理** → 完善的權限請求和錯誤處理

### 學習成果:
- 完整的 React Native 應用程式開發流程
- Expo 生態系統的深度使用
- 問題診斷和系統性故障排除
- 用戶體驗設計和權限管理
- 數據結構設計和匯出格式規劃

---

## 📊 作業要求滿足確認

### [1] App URI ✅
- Expo.dev 連結已更新在 README.md
- 成功的 Android EAS build

### [2] RN Source Code + AI History ✅ 
- 完整的 App.js 源代碼
- 此 Human-AI 互動歷史文件

### [3] Data Folder ✅
- `/data/` 資料夾已建立
- 等待從手機 AirDrop JSON 匯出檔案

---

## 🎓 結語

這個專案展示了完整的 Human-AI 協作開發過程，從初始概念到最終可部署的應用程式。AI 協助解決了多個技術挑戰，包括依賴管理、API 整合、錯誤診斷和用戶體驗優化。最終產品是一個功能完整、穩定可靠的情緒追蹤應用程式，滿足所有作業要求並提供良好的用戶體驗。
