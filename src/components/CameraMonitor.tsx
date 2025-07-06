import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface CameraMonitorProps {
  running: boolean;
  onStatusChange: (status: 'normal' | 'pause' | 'fail' | 'error') => void;
}

const CameraMonitor: React.FC<CameraMonitorProps> = ({ running, onStatusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStatus = useRef<'normal' | 'pause' | 'fail'>('normal');
  const startedDetect = useRef(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [detectionHistory, setDetectionHistory] = useState<number[]>([]);

  // 加载模型并设置加载状态
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('开始加载人脸检测模型...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        console.log('人脸检测模型加载完成');
        setModelLoaded(true);
      } catch (error) {
        console.error('模型加载失败:', error);
        onStatusChange('error');
      }
    };
    loadModel();
  }, [onStatusChange]);

  // 打开摄像头
  useEffect(() => {
    if (!running) return;
    const video = videoRef.current;
    if (!video) return;
    startedDetect.current = false;
    
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      } 
    }).then(stream => {
      video.srcObject = stream;
      video.play();
      console.log('摄像头已启动');
    }).catch((error) => {
      console.error('摄像头启动失败:', error);
      onStatusChange('error');
    });
    
    return () => {
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [running, onStatusChange]);

  // 只有video播放且模型加载完成后才启动检测
  useEffect(() => {
    if (!running || !modelLoaded) return;
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => {
      if (startedDetect.current) return;
      startedDetect.current = true;
      console.log('开始人脸检测...');
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        // 更严格的视频状态检查
        if (!video || video.paused || video.ended || video.readyState < 2 || video.videoWidth === 0) {
          console.log('视频未准备好，跳过检测');
          return;
        }
        
        try {
          // 尝试多种检测策略
          let detections: any[] = [];
          let bestDetectionCount = 0;
          
          // 策略1: 极低阈值检测
          try {
            const options1 = new faceapi.TinyFaceDetectorOptions({
              inputSize: 160,
              scoreThreshold: 0.01  // 极低阈值
            });
            const detections1 = await faceapi.detectAllFaces(video, options1);
            console.log(`策略1检测到 ${detections1.length} 个人脸`);
            if (detections1.length > 0) {
              detections = detections1;
              bestDetectionCount = detections1.length;
            }
          } catch (e) {
            console.log('策略1失败:', e);
          }
          
          // 策略2: 如果策略1失败，尝试更小的inputSize
          if (detections.length === 0) {
            try {
              const options2 = new faceapi.TinyFaceDetectorOptions({
                inputSize: 128,
                scoreThreshold: 0.05
              });
              const detections2 = await faceapi.detectAllFaces(video, options2);
              console.log(`策略2检测到 ${detections2.length} 个人脸`);
              if (detections2.length > 0) {
                detections = detections2;
                bestDetectionCount = detections2.length;
              }
            } catch (e) {
              console.log('策略2失败:', e);
            }
          }
          
          // 策略3: 如果前两个策略都失败，尝试标准参数
          if (detections.length === 0) {
            try {
              const options3 = new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.1
              });
              const detections3 = await faceapi.detectAllFaces(video, options3);
              console.log(`策略3检测到 ${detections3.length} 个人脸`);
              if (detections3.length > 0) {
                detections = detections3;
                bestDetectionCount = detections3.length;
              }
            } catch (e) {
              console.log('策略3失败:', e);
            }
          }
          
          // 更新检测历史
          const newHistory = [...detectionHistory, bestDetectionCount].slice(-5); // 保留最近5次检测
          setDetectionHistory(newHistory);
 
          
          // 智能判断：如果最近几次检测中有过1个人脸，且当前检测到0个，可能是误判
          const hasRecentFace = newHistory.some(count => count >= 1);
          const finalCount = bestDetectionCount === 0 && hasRecentFace ? 1 : bestDetectionCount;
          
          setDetectionCount(finalCount);
          console.log(`最终检测结果: ${finalCount} 个人脸 (原始: ${bestDetectionCount})`);
          console.log(`检测历史: [${newHistory.join(', ')}]`);
          
          // 添加检测结果的详细信息
          if (detections.length > 0) {
            detections.forEach((detection, index) => {
              console.log(`人脸 ${index + 1}: 置信度 ${detection.score.toFixed(3)}, 位置: ${JSON.stringify(detection.box)}`);
            });
          } else {
            console.log('所有策略都未检测到人脸');
          }
          
          // 修正判断逻辑：只有检测到恰好1个人脸时才是normal
          if (finalCount === 1) {
            console.log('检测到恰好1个人脸，状态正常');
            if (lastStatus.current !== 'normal') {
              console.log('状态切换到正常');
              onStatusChange('normal');
            }
            lastStatus.current = 'normal';
            if (pauseTimer.current) { clearTimeout(pauseTimer.current); pauseTimer.current = null; }
            if (failTimer.current) { clearTimeout(failTimer.current); failTimer.current = null; }
          } else {
            // 检测到0个或大于1个人脸都进入pause状态
            if (lastStatus.current === 'normal') {
              console.log(`检测到${finalCount}个人脸，状态切换到暂停`);
              onStatusChange('pause');
              lastStatus.current = 'pause';
              pauseTimer.current = setTimeout(() => {
                console.log('状态切换到失败');
                onStatusChange('fail');
                lastStatus.current = 'fail';
              }, 10000);
            }
          }
        } catch (error) {
          console.error('人脸检测出错:', error);
          setDetectionCount(-1); // 表示检测出错
        }
      }, 1000);
    };
    
    video.addEventListener('play', handlePlay);
    return () => {
      video.removeEventListener('play', handlePlay);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      if (failTimer.current) clearTimeout(failTimer.current);
    };
  }, [running, modelLoaded, onStatusChange]);

  return (
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <video 
        ref={videoRef} 
        width={480} 
        height={360} 
        style={{ border: '2px solid #333', borderRadius: 8 }} 
        autoPlay 
        muted 
        playsInline
      />
      {!modelLoaded && (
        <div style={{ marginTop: 10, color: '#666' }}>
          正在加载人脸检测模型...
        </div>
      )}
      {modelLoaded && (
        <div style={{ marginTop: 10, color: '#333' }}>
          检测到的人脸数量: {detectionCount >= 0 ? detectionCount : '检测出错'}
          {detectionCount === 1 && (
            <span style={{ color: '#28a745', fontSize: '0.9em' }}>
              (状态正常)
            </span>
          )}
          {(detectionCount === 0 || detectionCount > 1) && (
            <span style={{ color: '#ffc107', fontSize: '0.9em' }}>
              (状态暂停)
            </span>
          )}
          {detectionHistory.length > 0 && (
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: 5 }}>
              检测历史: [{detectionHistory.join(', ')}]
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraMonitor; 