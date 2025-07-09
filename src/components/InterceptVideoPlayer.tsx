import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { createPortal } from "react-dom";

// 覆盖元素
const FullscreenOverlay: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  
  const overlayElement = (
    <div
      style={{
        position: "fixed",
        top: 40,
        left: 0,
        width: "100vw",
        zIndex: 2147483647,
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "rgba(201, 29, 29, 0.6)",
          color: "#fff",
          padding: "8px 24px",
          borderRadius: 8,
          pointerEvents: "auto",
        }}
      >
        这是全屏时显示的元素
      </div>
    </div>
  );
  
  return createPortal(overlayElement, document.body);
};

const InterceptVideoPlayer: React.FC = () => {
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      
      if (
        fullscreenElement &&
        playerWrapperRef.current &&
        playerWrapperRef.current.contains(fullscreenElement)
      ) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    }

    // 监听全屏变化
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // 使用 MutationObserver 监听 DOM 变化，拦截全屏按钮
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // 查找全屏按钮
            const fullscreenButtons = element.querySelectorAll('button');
            fullscreenButtons.forEach((button) => {
              // 检查是否是全屏按钮（通过多种方式识别）
              const isFullscreenButton = 
                button.getAttribute('aria-label')?.includes('fullscreen') ||
                button.getAttribute('title')?.includes('fullscreen') ||
                button.textContent?.includes('⛶') ||
                button.textContent?.includes('⏹️') ||
                button.innerHTML.includes('fullscreen') ||
                button.className.includes('fullscreen');
              
              if (isFullscreenButton) {
                console.log('找到全屏按钮，替换点击行为');
                
                // 移除原有的事件监听器
                const newButton = button.cloneNode(true) as HTMLButtonElement;
                button.parentNode?.replaceChild(newButton, button);
                
                // 添加自定义点击事件
                newButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  console.log('自定义全屏按钮被点击');
                  
                  // 执行自定义全屏逻辑
                  if (playerWrapperRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      playerWrapperRef.current.requestFullscreen();
                    }
                  }
                });
              }
            });
          }
        });
      });
    });

    // 开始观察
    if (playerWrapperRef.current) {
      observer.observe(playerWrapperRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={playerWrapperRef}>
        <ReactPlayer
          url="https://www.w3schools.com/html/mov_bbb.mp4"
          controls
          width="100%"
          height="360px"
        />
      </div>
      <FullscreenOverlay show={isFullscreen} />
    </>
  );
};

export default InterceptVideoPlayer; 