// import React, { useState, useRef, useEffect } from 'react';

// const SnapToEdge = () => {
//   const draggableRef = useRef<HTMLDivElement>(null);
//   const [position, setPosition] = useState({ x: 0, y: 0 });
//   const [isDragging, setIsDragging] = useState(false);
//   const dragOffset = useRef({ x: 0, y: 0 });

//   // 初始化元素位置（居中）
//   useEffect(() => {
//     if (draggableRef.current) {
//       const { width, height } = draggableRef.current.getBoundingClientRect();
//       setPosition({
//         x: window.innerWidth / 2 - width / 2,
//         y: window.innerHeight / 2 - height / 2
//       });
//     }
//   }, []);

//   // 处理鼠标按下事件
//   const handleMouseDown = (e: React.MouseEvent) => {
//     if (!draggableRef.current) return;
    
//     const rect = draggableRef.current.getBoundingClientRect();
//     dragOffset.current = {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top
//     };
//     setIsDragging(true);
//   };

//   // 处理鼠标移动
//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       if (!isDragging || !draggableRef.current) return;
      
//       const { width, height } = draggableRef.current.getBoundingClientRect();
//       const windowWidth = window.innerWidth;
//       const windowHeight = window.innerHeight;
      
//       // 计算新位置（确保在窗口内）
//       let newX = e.clientX - dragOffset.current.x;
//       let newY = e.clientY - dragOffset.current.y;
      
//       // 确保元素不超出边界
//       newX = Math.max(0, Math.min(newX, windowWidth - width));
//       newY = Math.max(0, Math.min(newY, windowHeight - height));
      
//       setPosition({ x: newX, y: newY });
//     };

//     const handleMouseUp = () => {
//       if (!isDragging || !draggableRef.current) return;
//       setIsDragging(false);
      
//       // 吸附到最近的边缘
//       const { width, height } = draggableRef.current.getBoundingClientRect();
//       const windowWidth = window.innerWidth;
//       const windowHeight = window.innerHeight;
      
//       // 计算到各边的距离
//       const distances = {
//         left: position.x,
//         right: windowWidth - (position.x + width),
//         top: position.y,
//         bottom: windowHeight - (position.y + height)
//       };
      
//       // 找到最近边缘
//       const closestEdge = Object.entries(distances).reduce(
//         (closest, [edge, distance]) => 
//           distance < closest.distance ? { edge, distance } : closest,
//         { edge: 'left', distance: Infinity }
//       ).edge as keyof typeof distances;
      
//       // 执行吸附
//       switch (closestEdge) {
//         case 'left':
//           setPosition({ ...position, x: 0 });
//           break;
//         case 'right':
//           setPosition({ ...position, x: windowWidth - width });
//           break;
//         case 'top':
//           setPosition({ ...position, y: 0 });
//           break;
//         case 'bottom':
//           setPosition({ ...position, y: windowHeight - height });
//           break;
//       }
//     };

//     if (isDragging) {
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//     }
    
//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [isDragging, position]);

//   return (
//     <div className="relative w-screen h-screen overflow-hidden bg-gray-50">
//       <div
//         ref={draggableRef}
//         className={`absolute w-24 h-24 bg-blue-500 rounded-lg shadow-lg cursor-move flex items-center justify-center text-white font-bold  ${
//           isDragging ? 'shadow-xl opacity-90' : ''
//         }`}
//         style={{
//           left: `${position.x}px`,
//           top: `${position.y}px`,
//           transition: isDragging ? 'none' : 'left 0.3s, top 0.3s',
//           userSelect: 'none'
//         }}
//         onMouseDown={handleMouseDown}
//       >
//         拖拽我
//       </div>
      
//       <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md text-sm">
//         当前位置: X={position.x.toFixed(0)}px, Y={position.y.toFixed(0)}px
//       </div>
//     </div>
//   );
// };

// export default SnapToEdge;

import SnapToEdge from './components/Test';
import VideoWithOverlay from "./components/InterceptVideoPlayer";

export default function App() {
  return (
    <>
      <VideoWithOverlay />
    </>
  );
}