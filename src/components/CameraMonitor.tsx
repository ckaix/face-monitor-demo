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
          // 调整检测参数，降低阈值
          const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.2  // 进一步降低阈值，提高检测灵敏度
          });
          
          const detections = await faceapi.detectAllFaces(video, options);
          setDetectionCount(detections.length);
          console.log(`检测到 ${detections.length} 个人脸`);
          
          // 添加检测结果的详细信息
          if (detections.length > 0) {
            detections.forEach((detection, index) => {
              console.log(`人脸 ${index + 1}: 置信度 ${detection.score.toFixed(3)}, 位置: ${JSON.stringify(detection.box)}`);
            });
          }
          
          if (detections.length === 1) {
            if (lastStatus.current !== 'normal') {
              console.log('状态切换到正常');
              onStatusChange('normal');
            }
            lastStatus.current = 'normal';
            if (pauseTimer.current) { clearTimeout(pauseTimer.current); pauseTimer.current = null; }
            if (failTimer.current) { clearTimeout(failTimer.current); failTimer.current = null; }
          } else {
            if (lastStatus.current === 'normal') {
              console.log('状态切换到暂停');
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
        </div>
      )}
    </div>
  );
};

export default CameraMonitor; 