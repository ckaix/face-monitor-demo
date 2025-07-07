import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  useDraggable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
   
    DragEndEvent,
    DragStartEvent
  } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const DraggableAd = () => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable-ad',
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-24 h-24 bg-blue-500 rounded-lg shadow-lg cursor-move flex items-center justify-center text-white font-bold select-none touch-none"
    >
      拖拽我（支持触摸）
    </div>
  );
};

const SnapToEdge = () => {
  const draggableRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPosition = useRef({ x: 0, y: 0 }); // 修复点1：记录拖拽起始位置

  // 初始化居中
  useEffect(() => {
    if (draggableRef.current) {
      const { width, height } = draggableRef.current.getBoundingClientRect();
      setPosition({
        x: (window.innerWidth - width) / 2,
        y: (window.innerHeight - height) / 2
      });
    }
  }, []);

  // 传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 3 } // 减小误触阈值[4](@ref)
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 } // 优化触摸响应[1](@ref)
    })
  );

  // 拖拽开始：记录起始位置
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
    startPosition.current = position; // 修复点2：保存拖拽起始坐标
  }, [position]);

  // 计算最近边缘（无过渡跳变版）
  const snapToEdge = useCallback((x: number, y: number) => {
    if (!draggableRef.current) return { x, y };
    
    const rect = draggableRef.current.getBoundingClientRect();
    const { width, height } = rect;
    const win = { w: window.innerWidth, h: window.innerHeight };
    
    // 计算到各边缘距离
    const distances = {
      top: y,
      bottom: win.h - (y + height),
      left: x,
      right: win.w - (x + width)
    };
    
    // 确定最近边缘
    const closestEdge = Object.entries(distances).reduce(
      (closest, [edge, dist]) => 
        dist < closest.distance ? { edge, distance: dist } : closest,
      { edge: 'top', distance: Infinity }
    ).edge as keyof typeof distances;
    
    // 直接返回吸附位置（跳过中间状态）
    switch (closestEdge) {
      case 'top': return { x, y: 0 };
      case 'bottom': return { x, y: win.h - height };
      case 'left': return { x: 0, y };
      case 'right': return { x: win.w - width, y };
      default: return { x, y };
    }
  }, []);

  // 拖拽结束处理（核心修复）
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { delta } = event;
    
    // 修复点3：基于起始位置计算终点（非当前状态）
    const targetX = startPosition.current.x + delta.x;
    const targetY = startPosition.current.y + delta.y;
    
    // 边界约束
    const rect = draggableRef.current!.getBoundingClientRect();
    const boundedX = Math.max(0, Math.min(targetX, window.innerWidth - rect.width));
    const boundedY = Math.max(0, Math.min(targetY, window.innerHeight - rect.height));
    
    // 直接计算最终吸附位置
    const snappedPos = snapToEdge(boundedX, boundedY);
    setPosition(snappedPos);
    setIsDragging(false);
  }, [snapToEdge]);

  // 窗口大小变化时重定位
  useEffect(() => {
    const handleResize = () => {
      const snappedPos = snapToEdge(position.x, position.y);
      if (snappedPos.x !== position.x || snappedPos.y !== position.y) {
        setPosition(snappedPos);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, snapToEdge]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50 touch-none">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={draggableRef}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            transition: isDragging ? 'none' : 'left 0.3s, top 0.3s' // 拖拽中禁用过渡动画
          }}
        >
          <DraggableAd />
        </div>
      </DndContext>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-sm">
        位置: X={position.x.toFixed(0)}, Y={position.y.toFixed(0)}
      </div>
    </div>
  );
};

export default SnapToEdge;