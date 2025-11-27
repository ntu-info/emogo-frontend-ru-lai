import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 設定通知處理器
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const emotions = [
  { value: 5, emoji: '😊', label: 'Very Happy', color: '#4CAF50' },
  { value: 4, emoji: '🙂', label: 'Happy', color: '#8BC34A' },
  { value: 3, emoji: '😐', label: 'Neutral', color: '#FFC107' },
  { value: 2, emoji: '🙁', label: 'Sad', color: '#FF9800' },
  { value: 1, emoji: '😢', label: 'Very Sad', color: '#F44336' },
];

export default function App() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [notificationPermission, setNotificationPermission] = useState(null);
  const cameraRef = useRef(null);

  // 數據持久化功能
  const STORAGE_KEY = '@emogo_responses';

  const loadStoredData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setResponses(parsedData);
        console.log('載入已存儲的數據:', parsedData.length, '筆記錄');
      }
    } catch (error) {
      console.error('載入數據失敗:', error);
    }
  };

  const saveDataToStorage = async (newResponses) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newResponses));
      console.log('數據已保存:', newResponses.length, '筆記錄');
    } catch (error) {
      console.error('保存數據失敗:', error);
    }
  };

  // 在組件載入時讀取數據
  useEffect(() => {
    loadStoredData();
  }, []);

  // 當 responses 改變時自動保存
  useEffect(() => {
    if (responses.length > 0) {
      saveDataToStorage(responses);
    }
  }, [responses]);

  const getCurrentLocation = async () => {
    try {
      // 檢查位置權限
      if (!locationPermission?.granted) {
        const { status } = await requestLocationPermission();
        if (status !== 'granted') {
          return null; // 沒有位置權限，返回 null
        }
      }
      
      // 獲取當前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000, // 10秒超時
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.warn('獲取位置失敗:', error);
      return null; // 獲取失敗，返回 null
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status);
      return status === 'granted';
    } catch (error) {
      console.warn('請求通知權限失敗:', error);
      return false;
    }
  };

  const scheduleDaily3Notifications = async () => {
    try {
      // 首先取消所有現有的通知
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // 設定三個時段的通知
      const notificationTimes = [
        { hour: 9, minute: 0, title: '🌅 早安！記錄今天的第一份心情' },
        { hour: 14, minute: 0, title: '☀️ 午安！分享你現在的感受' },
        { hour: 20, minute: 0, title: '🌙 晚安！記錄今天最後的心情' }
      ];

      for (const time of notificationTimes) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: time.title,
            body: '點擊記錄你的情緒 + 1秒 vlog + GPS 位置 📍',
            data: { type: 'daily_reminder' },
            sound: true,
          },
          trigger: {
            hour: time.hour,
            minute: time.minute,
            repeats: true,
          },
        });
      }

      Alert.alert(
        '🔔 通知設定完成',
        '每天早上9點、下午2點、晚上8點會提醒您記錄心情！',
        [{ text: '好的' }]
      );
    } catch (error) {
      console.error('設定通知失敗:', error);
      Alert.alert('錯誤', '設定通知失敗，請檢查權限設定');
    }
  };

  const setupNotifications = async () => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      await scheduleDaily3Notifications();
      
      // 提供使用建議
      Alert.alert(
        '🔔 通知設定完成！',
        '為了確保收到提醒通知：\n\n📱 將 EmoGo 保持在背景\n⏰ 每天 9:00、14:00、20:00 會自動提醒\n🔄 可隨時重新進入應用程式\n\n建議：將應用程式加入常用，方便快速開啟！',
        [{ text: '我知道了' }]
      );
    } else {
      Alert.alert(
        '需要通知權限',
        '請在設定中開啟通知權限，以接收每日心情提醒',
        [{ text: '好的' }]
      );
    }
  };

  const exportData = async () => {
    try {
      if (responses.length === 0) {
        Alert.alert('無數據', '請先記錄一些情緒數據再匯出');
        return;
      }

      // 檢查數據要求
      const emotionData = responses.filter(r => r.emotion);
      const vlogData = responses.filter(r => r.hasVlog);
      const locationData = responses.filter(r => r.location);
      
      // 檢查時間跨度
      const timestamps = responses.map(r => new Date(r.timestamp));
      const earliestTime = Math.min(...timestamps);
      const latestTime = Math.max(...timestamps);
      const timeSpanHours = (latestTime - earliestTime) / (1000 * 60 * 60);
      
      let validationMessage = '數據驗證結果：\n';
      validationMessage += `📊 情緒記錄: ${emotionData.length} 筆\n`;
      validationMessage += `📹 Vlog 記錄: ${vlogData.length} 筆\n`;
      validationMessage += `📍 GPS 記錄: ${locationData.length} 筆\n`;
      validationMessage += `⏰ 時間跨度: ${timeSpanHours.toFixed(1)} 小時\n\n`;
      
      const meetsRequirements = emotionData.length >= 3 && 
                               vlogData.length >= 3 && 
                               locationData.length >= 3 && 
                               timeSpanHours > 12;
      
      if (!meetsRequirements) {
        validationMessage += '⚠️ 未符合作業要求：\n';
        if (emotionData.length < 3) validationMessage += '• 情緒記錄需要至少 3 筆\n';
        if (vlogData.length < 3) validationMessage += '• Vlog 記錄需要至少 3 筆\n';
        if (locationData.length < 3) validationMessage += '• GPS 記錄需要至少 3 筆\n';
        if (timeSpanHours <= 12) validationMessage += '• 時間跨度需要超過 12 小時\n';
        
        Alert.alert('數據不足', validationMessage);
        return;
      }

      // 準備匯出數據
      const exportData = {
        metadata: {
          appName: 'EmoGo',
          exportDate: new Date().toISOString(),
          totalRecords: responses.length,
          emotionRecords: emotionData.length,
          vlogRecords: vlogData.length,
          locationRecords: locationData.length,
          timeSpanHours: timeSpanHours.toFixed(2),
          meetsRequirements: true,
        },
        emotionData: responses.map(r => ({
          id: r.id,
          emotion: r.emotion,
          emotionLabel: emotions.find(e => e.value === r.emotion)?.label,
          timestamp: r.timestamp,
          hasVlog: r.hasVlog,
          location: r.location ? {
            latitude: r.location.latitude,
            longitude: r.location.longitude,
            accuracy: r.location.accuracy
          } : null
        })),
        statistics: {
          averageEmotion: (responses.reduce((sum, r) => sum + r.emotion, 0) / responses.length).toFixed(2),
          emotionDistribution: emotions.map(e => ({
            emotion: e.label,
            count: responses.filter(r => r.emotion === e.value).length
          })),
          vlogSuccessRate: ((vlogData.length / responses.length) * 100).toFixed(1) + '%',
          locationSuccessRate: ((locationData.length / responses.length) * 100).toFixed(1) + '%'
        }
      };

      // 寫入檔案
      const dataDir = FileSystem.documentDirectory + 'data/';
      await FileSystem.makeDirectoryAsync(dataDir, { intermediates: true });
      
      const fileName = `emogo_export_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = dataDir + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
      
      // 分享檔案
      Alert.alert(
        '✅ 匯出成功！',
        validationMessage + '數據已匯出為 JSON 檔案',
        [
          { text: '查看檔案', onPress: () => shareExportedFile(filePath) },
          { text: '完成' }
        ]
      );
      
    } catch (error) {
      console.error('匯出失敗:', error);
      Alert.alert('錯誤', '數據匯出失敗: ' + error.message);
    }
  };

  const shareExportedFile = async (filePath) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: '分享 EmoGo 匯出數據'
        });
      }
    } catch (error) {
      console.error('分享失敗:', error);
    }
  };

  const handleEmotionSelect = async (emotion) => {
    setSelectedEmotion(emotion);
    
    // 檢查相機權限
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
      if (!cameraPermission?.granted) {
        // 如果沒有相機權限，只記錄情緒
        recordEmotionOnly(emotion);
        return;
      }
    }
    
    if (!mediaPermission?.granted) {
      await requestMediaPermission();
    }
    
    // 直接開始錄製 vlog
    startEmotionVlog(emotion);
  };

  const recordEmotionOnly = async (emotion) => {
    // 獲取位置資訊
    const location = await getCurrentLocation();
    
    const newResponse = {
      id: Date.now(),
      emotion: emotion.value,
      timestamp: new Date().toISOString(),
      hasVlog: false,
      location: location, // 包含 GPS 座標或 null
    };
    
    setResponses(prev => [...prev, newResponse]);
    
    const locationText = location 
      ? `\n📍 位置: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      : '\n📍 位置: 無法獲取';
    
    Alert.alert(
      '情緒已記錄！',
      `${emotion.emoji} ${emotion.label}${locationText}`,
      [{ text: '好的' }]
    );

    setTimeout(() => setSelectedEmotion(null), 1000);
  };

  const getAverage = () => {
    if (responses.length === 0) return 0;
    const sum = responses.reduce((a, b) => a + b.emotion, 0);
    return (sum / responses.length).toFixed(2);
  };

  const resetData = () => {
    Alert.alert(
      '清除資料',
      '確定要清除所有紀錄嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: () => setResponses([]) }
      ]
    );
  };

  const startEmotionVlog = async (emotion) => {
    setShowCamera(true);
    
    // 倒數計時
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        recordEmotionVlog(emotion);
      }
    }, 1000);
  };



  const recordEmotionVlog = async (emotion) => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      setCountdown(0);
      
      // 同時獲取位置和錄製影片
      const [video, location] = await Promise.all([
        cameraRef.current.recordAsync({
          quality: '720p',
          maxDuration: 1, // 1秒限制
          mute: false,
        }),
        getCurrentLocation()
      ]);

      if (video) {
        // 保存到媒體庫
        if (mediaPermission?.granted) {
          await MediaLibrary.createAssetAsync(video.uri);
        }

        // 記錄情緒數據（包含vlog信息和位置）
        const newResponse = {
          id: Date.now(),
          emotion: emotion.value,
          timestamp: new Date().toISOString(),
          hasVlog: true,
          vlogUri: video.uri,
          location: location, // 包含 GPS 座標或 null
        };
        
        setResponses(prev => [...prev, newResponse]);
        setShowCamera(false);
        
        const locationText = location 
          ? `\n📍 位置: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
          : '\n📍 位置: 無法獲取';
        
        Alert.alert(
          `📹 ${emotion.emoji} 情緒 + Vlog 記錄完成！`,
          `情緒：${emotion.label}\n1秒 vlog 已保存${locationText}`,
          [
            { 
              text: '分享 Vlog', 
              onPress: () => shareVlog(video.uri) 
            },
            { 
              text: '完成' 
            }
          ]
        );
      }
    } catch (error) {
      console.error('錄製情緒 vlog 時出錯:', error);
      Alert.alert('錯誤', '錄製失敗，但情緒已記錄');
      recordEmotionOnly(emotion);
    } finally {
      setIsRecording(false);
      setTimeout(() => setSelectedEmotion(null), 1000);
    }
  };



  const shareVlog = async (uri) => {
    try {
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'video/mp4',
          dialogTitle: '分享你的 1秒 vlog'
        });
      }
    } catch (error) {
      console.error('分享錯誤:', error);
    }
  };

  if (showCamera) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.cameraFullScreen}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            mode="video"
          >
            {/* 倒數計時 */}
            {countdown > 0 && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}

            {/* 錄製指示器 */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>錄製中...</Text>
              </View>
            )}

            {/* 關閉按鈕 */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </CameraView>
          
          <View style={styles.cameraHint}>
            <Text style={styles.cameraHintText}>
              {countdown > 0 
                ? `準備錄製情緒 vlog... ${countdown}` 
                : isRecording 
                  ? '錄製中... (1秒)' 
                  : '情緒 + Vlog 錄製器'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 標題 */}
        <View style={styles.header}>
          <Text style={styles.title}>EmoGo 情緒追蹤</Text>
          <Text style={styles.subtitle}>今天你的心情如何？</Text>
        </View>

        {/* 情緒選擇區域 */}
        <View style={styles.emotionContainer}>
          {emotions.map((emotion) => (
            <TouchableOpacity
              key={emotion.value}
              style={[
                styles.emotionButton,
                selectedEmotion?.value === emotion.value && {
                  backgroundColor: emotion.color,
                  transform: [{ scale: 1.1 }],
                },
              ]}
              onPress={() => handleEmotionSelect(emotion)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{emotion.emoji}</Text>
              <Text style={styles.label}>{emotion.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 情緒指示條 */}
        <View style={styles.scaleContainer}>
          <Text style={styles.scaleLabel}>情緒量表</Text>
          <View style={styles.scaleBar}>
            {emotions.reverse().map((emotion, index) => (
              <View 
                key={index} 
                style={[styles.scaleSegment, { backgroundColor: emotion.color }]} 
              />
            ))}
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleText}>很難過</Text>
            <Text style={styles.scaleText}>很開心</Text>
          </View>
        </View>

        {/* 統計區域 */}
        {responses.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 統計資料</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>總記錄數: {responses.length}</Text>
              <Text style={styles.statsText}>平均分數: {getAverage()}</Text>
            </View>
            
            {/* 最近記錄 */}
            <Text style={styles.recentTitle}>最近記錄:</Text>
            {responses.slice(-3).reverse().map((response, index) => {
              const emotion = emotions.find(e => e.value === response.emotion);
              return (
                <View key={response.id} style={styles.recentItem}>
                  <Text style={styles.recentEmoji}>{emotion?.emoji}</Text>
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentText}>
                      {emotion?.label} - {new Date(response.timestamp).toLocaleTimeString()}
                    </Text>
                    <View style={styles.indicatorRow}>
                      {response.hasVlog && (
                        <Text style={styles.vlogIndicator}>📹 含 vlog</Text>
                      )}
                      {response.location && (
                        <Text style={styles.locationIndicator}>
                          📍 {response.location.latitude.toFixed(4)}, {response.location.longitude.toFixed(4)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
            
            <View style={styles.vlogStats}>
              <Text style={styles.vlogStatsText}>
                📹 vlog 記錄: {responses.filter(r => r.hasVlog).length}/{responses.length}
              </Text>
              <Text style={styles.vlogStatsText}>
                📍 GPS 記錄: {responses.filter(r => r.location).length}/{responses.length}
              </Text>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.exportButton} onPress={exportData}>
                <Text style={styles.exportButtonText}>� 匯出數據</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.notificationButton} onPress={setupNotifications}>
                <Text style={styles.notificationButtonText}>� 測試通知 (僅限前台)</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.resetButton} onPress={resetData}>
              <Text style={styles.resetButtonText}>清除所有資料</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 使用說明 */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>📝 使用方式</Text>
          <Text style={styles.instructionText}>🎯 點擊情緒按鈕自動記錄心情 + 1秒 vlog</Text>
          <Text style={styles.instructionText}>📹 每次情緒記錄都會拍攝真實的你</Text>
          <Text style={styles.instructionText}>� 情緒數據和 vlog 都會自動保存</Text>
        </View>

        {/* 通知設定提醒 */}
        <View style={styles.notificationSetupContainer}>
          <Text style={styles.notificationSetupTitle}>� 自動提醒設定</Text>
          <Text style={styles.notificationSetupText}>📱 為了確保您不會錯過記錄時間：</Text>
          <Text style={styles.notificationSetupText}>1️⃣ 點擊下方「🔔 設定每日提醒」按鈕</Text>
          <Text style={styles.notificationSetupText}>2️⃣ 允許通知權限</Text>
          <Text style={styles.notificationSetupText}>3️⃣ 保持應用程式在背景運行</Text>
          <Text style={styles.notificationSetupNote}>💡 每天 9:00、14:00、20:00 自動提醒您記錄心情</Text>
        </View>

        {/* 通知設定按鈕 - 獨立顯示 */}
        <View style={styles.mainNotificationContainer}>
          <TouchableOpacity style={styles.mainNotificationButton} onPress={setupNotifications}>
            <Text style={styles.mainNotificationButtonText}>🔔 設定每日提醒</Text>
          </TouchableOpacity>
        </View>

        {/* 提示文字 */}
        {responses.length === 0 && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>點擊表情符號記錄心情 + 1秒 vlog ✨</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  emotionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  emotionButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    margin: 5,
    minWidth: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  emoji: {
    fontSize: 35,
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  scaleContainer: {
    marginBottom: 30,
  },
  scaleLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  scaleBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 5,
  },
  scaleSegment: {
    flex: 1,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 12,
    color: '#888',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  recentEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  recentText: {
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  notificationButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.48,
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.48,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  hintContainer: {
    alignItems: 'center',
    padding: 20,
  },
  hintText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 3,
  },
  notificationSetupContainer: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  notificationSetupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8,
  },
  notificationSetupText: {
    fontSize: 13,
    color: '#8e24aa',
    marginBottom: 2,
    marginLeft: 8,
  },
  notificationSetupNote: {
    fontSize: 12,
    color: '#9c27b0',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mainNotificationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainNotificationButton: {
    backgroundColor: '#9c27b0',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  mainNotificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentTextContainer: {
    flex: 1,
  },
  indicatorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  vlogIndicator: {
    fontSize: 10,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginRight: 8,
  },
  locationIndicator: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  vlogStats: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  vlogStatsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },

  // 相機全螢幕樣式
  cameraFullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraHint: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHintText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
