import React, { useRef, useState, useEffect } from 'react';

const BOX_WIDTH = 96; // tailwind w-24
const BOX_HEIGHT = 96; // tailwind h-24

function getNearestEdge(x: number, y: number, winW: number, winH: number) {
  const dLeft = x;
  const dRight = winW - x - BOX_WIDTH;
  const dTop = y;
  const dBottom = winH - y - BOX_HEIGHT;
  const min = Math.min(dLeft, dRight, dTop, dBottom);
  if (min === dLeft) return { x: 0, y };
  if (min === dRight) return { x: winW - BOX_WIDTH, y };
  if (min === dTop) return { x, y: 0 };
  return { x, y: winH - BOX_HEIGHT };
}

const SnapToEdgeNative: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  // 初始化居中
  useEffect(() => {
    setPosition({
      x: (window.innerWidth - BOX_WIDTH) / 2,
      y: (window.innerHeight - BOX_HEIGHT) / 2,
    });
  }, []);

  // 拖拽事件
  function handleDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDragging(true);
    let clientX = 0, clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    dragStart.current = {
      x: position.x,
      y: position.y,
      startX: clientX,
      startY: clientY,
    };
    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('touchmove', handleMove as any, { passive: false });
    window.addEventListener('mouseup', handleUp as any);
    window.addEventListener('touchend', handleUp as any);
  }

  function handleMove(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    if (!dragStart.current) return;
    let clientX = 0, clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    let newX = dragStart.current.x + (clientX - dragStart.current.startX);
    let newY = dragStart.current.y + (clientY - dragStart.current.startY);
    // 边界约束
    newX = Math.max(0, Math.min(newX, window.innerWidth - BOX_WIDTH));
    newY = Math.max(0, Math.min(newY, window.innerHeight - BOX_HEIGHT));
    setPosition({ x: newX, y: newY });
  }

  function handleUp(e?: MouseEvent | TouchEvent) {
    setDragging(false);
    if (!dragStart.current) return;
  
    let clientX = 0, clientY = 0;
    if (e && 'touches' in e && e.touches.length === 0 && 'changedTouches' in e && e.changedTouches.length > 0) {
      // touchend 时用 changedTouches
      clientX = e.changedTouches[0]?.clientX ?? 0;
      clientY = e.changedTouches[0]?.clientY ?? 0;
    } else if (e && 'touches' in e && e.touches.length > 0) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else if (e && 'clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      // 没有事件时，直接用最后一次move的position
      clientX = dragStart.current.startX;
      clientY = dragStart.current.startY;
    }
  
    // 计算松手时的box左上角
    let newX = dragStart.current.x + (clientX - dragStart.current.startX);
    let newY = dragStart.current.y + (clientY - dragStart.current.startY);
    newX = Math.max(0, Math.min(newX, window.innerWidth - BOX_WIDTH));
    newY = Math.max(0, Math.min(newY, window.innerHeight - BOX_HEIGHT));
  
    // 吸附
    const snapped = getNearestEdge(newX, newY, window.innerWidth, window.innerHeight);
    const x = Math.max(0, Math.min(snapped.x, window.innerWidth - BOX_WIDTH));
    const y = Math.max(0, Math.min(snapped.y, window.innerHeight - BOX_HEIGHT));
    setPosition({ x, y });
  
    dragStart.current = null;
    window.removeEventListener('mousemove', handleMove as any);
    window.removeEventListener('touchmove', handleMove as any);
    window.removeEventListener('mouseup', handleUp as any);
    window.removeEventListener('touchend', handleUp as any);
  }

  // 窗口变化时自动吸边
  useEffect(() => {
    const onResize = () => {
      const snapped = getNearestEdge(position.x, position.y, window.innerWidth, window.innerHeight);
      setPosition({
        x: Math.max(0, Math.min(snapped.x, window.innerWidth - BOX_WIDTH)),
        y: Math.max(0, Math.min(snapped.y, window.innerHeight - BOX_HEIGHT)),
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [position]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50 touch-none">
      <div
        ref={boxRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          transition: dragging ? 'none' : 'left 0.3s, top 0.3s',
          zIndex: 1000,
        }}
        className="w-24 h-24 bg-blue-500 rounded-lg shadow-lg cursor-move flex items-center justify-center text-white font-bold select-none touch-none"
        onMouseDown={handleDown}
        onTouchStart={handleDown}
      >
        拖拽我（原生）
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-sm">
        位置: X={position.x.toFixed(0)}, Y={position.y.toFixed(0)}
      </div>
    </div>
  );
};

export default SnapToEdgeNative;