import React, { useEffect, useRef } from 'react';
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

  // 只加载一次模型
  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  }, []);

  // 打开摄像头
  useEffect(() => {
    if (!running) return;
    const video = videoRef.current;
    if (!video) return;
    startedDetect.current = false;
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      video.srcObject = stream;
      video.play();
    }).catch(() => {
      onStatusChange('error');
    });
    return () => {
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [running, onStatusChange]);

  // 只有video播放后才启动检测
  useEffect(() => {
    if (!running) return;
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => {
      if (startedDetect.current) return;
      startedDetect.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        if (!video || video.paused || video.ended || video.readyState < 2) return;
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        if (detections.length === 1) {
          if (lastStatus.current !== 'normal') onStatusChange('normal');
          lastStatus.current = 'normal';
          if (pauseTimer.current) { clearTimeout(pauseTimer.current); pauseTimer.current = null; }
          if (failTimer.current) { clearTimeout(failTimer.current); failTimer.current = null; }
        } else {
          if (lastStatus.current === 'normal') {
            onStatusChange('pause');
            lastStatus.current = 'pause';
            pauseTimer.current = setTimeout(() => {
              onStatusChange('fail');
              lastStatus.current = 'fail';
            }, 10000);
          }
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
  }, [running, onStatusChange]);

  return (
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <video ref={videoRef} width={480} height={360} style={{ border: '2px solid #333', borderRadius: 8 }} autoPlay muted />
    </div>
  );
};

export default CameraMonitor; 