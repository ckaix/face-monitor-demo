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
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [detectionMethod, setDetectionMethod] = useState<string>('');

  // 加载模型并设置加载状态
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('开始加载人脸检测模型...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        ]);
        console.log('人脸检测和关键点模型加载完成');
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
      console.log('开始增强人脸检测...');
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        // 更严格的视频状态检查
        if (!video || video.paused || video.ended || video.readyState < 2 || video.videoWidth === 0) {
          console.log('视频未准备好，跳过检测');
          return;
        }
        
        try {
          // 方法1: 基础面部检测
          const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.1
          });
          
          const detections = await faceapi.detectAllFaces(video, options);
          const faceCount = detections.length;
          
          // 方法2: 关键点检测（如果基础检测失败）
          let landmarkCount = 0;
          let finalCount = faceCount;
          let method = '基础检测';
          
          if (faceCount === 0) {
            try {
              // 尝试关键点检测
              const facesWithLandmarks = await faceapi.detectAllFacesWithLandmarks(video, options);
              landmarkCount = facesWithLandmarks.length;
              
              if (landmarkCount > 0) {
                finalCount = landmarkCount;
                method = '关键点检测';
                console.log(`关键点检测成功: ${landmarkCount} 个面部`);
                
                // 分析关键点质量
                facesWithLandmarks.forEach((face, index) => {
                  if (face.landmarks) {
                    const positions = face.landmarks.positions;
                    console.log(`面部 ${index + 1}: 检测到 ${positions.length} 个关键点`);
                    
                    // 检查关键点分布（眼睛、鼻子、嘴巴等）
                    const eyePoints = positions.slice(36, 48); // 眼睛区域
                    const nosePoints = positions.slice(27, 36); // 鼻子区域
                    const mouthPoints = positions.slice(48, 68); // 嘴巴区域
                    
                    console.log(`  眼睛关键点: ${eyePoints.length}, 鼻子关键点: ${nosePoints.length}, 嘴巴关键点: ${mouthPoints.length}`);
                  }
                });
              }
            } catch (landmarkError) {
              console.log('关键点检测失败:', landmarkError);
            }
          } else {
            // 如果基础检测成功，也尝试关键点检测来增强信心
            try {
              const facesWithLandmarks = await faceapi.detectAllFacesWithLandmarks(video, options);
              landmarkCount = facesWithLandmarks.length;
              method = '基础+关键点检测';
              console.log(`增强检测: 基础检测 ${faceCount} 个, 关键点检测 ${landmarkCount} 个`);
            } catch (landmarkError) {
              console.log('增强关键点检测失败:', landmarkError);
            }
          }
          
          setDetectionCount(finalCount);
          setLandmarkCount(landmarkCount);
          setDetectionMethod(method);
          
          console.log(`检测结果: 面部=${faceCount}, 关键点=${landmarkCount}, 最终=${finalCount}, 方法=${method}`);
          
          // 添加检测结果的详细信息
          if (detections.length > 0) {
            detections.forEach((detection, index) => {
              console.log(`人脸 ${index + 1}: 置信度 ${detection.score.toFixed(3)}, 位置: ${JSON.stringify(detection.box)}`);
            });
          } else if (landmarkCount > 0) {
            console.log(`通过关键点检测到 ${landmarkCount} 个面部`);
          } else {
            console.log('未检测到任何人脸特征');
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
          正在加载人脸检测和关键点模型...
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
          {detectionMethod && (
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: 3 }}>
              检测方法: {detectionMethod}
            </div>
          )}
          {landmarkCount > 0 && (
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: 3 }}>
              关键点检测: {landmarkCount} 个面部
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraMonitor; 