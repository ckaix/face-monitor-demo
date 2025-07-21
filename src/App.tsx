import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [detections, setDetections] = useState([]);
  const faceDetectorRef = useRef(null);

  // 初始化人脸检测器
  const initFaceDetector = async () => {
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm');
    faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/models/blaze_face_short_range.tflite', // 根据需求切换模型
        delegate: 'GPU' // 启用GPU加速
      },
      minDetectionConfidence: 0.5, // 置信度阈值[1](@ref)
      runningMode: 'VIDEO' // 实时视频模式
    });
  };

  // 逐帧检测人脸
  const detect = async () => {
    if (!webcamRef.current || !canvasRef.current || !faceDetectorRef.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const startTime = performance.now();
    const results = faceDetectorRef.current.detectForVideo(video, startTime);
    setDetections(results.detections);

    // 绘制检测框和关键点
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    results.detections.forEach(detection => {
      const { boundingBox, keypoints } = detection;
      // 绘制边界框
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(boundingBox.originX, boundingBox.originY, boundingBox.width, boundingBox.height);
      // 绘制关键点（双眼、耳垂、嘴、鼻）
      keypoints.forEach(point => {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // 计算FPS
    const endTime = performance.now();
    setFps(Math.round(1000 / (endTime - startTime)));
    requestAnimationFrame(detect);
  };

  useEffect(() => {
    initFaceDetector().then(() => {
      if (webcamRef.current && faceDetectorRef.current) {
        detect();
      }
    });
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{ width: 640, height: 480 }} // 降低分辨率优化性能[5](@ref)
        style={{ display: 'block' }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <div>FPS: {fps} | 检测到 {detections.length} 张人脸</div>
    </div>
  );
};

export default App;