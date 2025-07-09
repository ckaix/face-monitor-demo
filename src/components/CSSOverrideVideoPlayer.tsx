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

const CSSOverrideVideoPlayer: React.FC = () => {
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

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const handleCustomFullscreen = () => {
    if (playerWrapperRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerWrapperRef.current.requestFullscreen();
      }
    }
  };

  return (
    <>
      <div 
        ref={playerWrapperRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <ReactPlayer
          url="https://www.w3schools.com/html/mov_bbb.mp4"
          controls
          width="100%"
          height="360px"
        />
        
        {/* 自定义全屏按钮 */}
        <button
          onClick={handleCustomFullscreen}
          style={{
            position: "fixed",
            bottom: "60px",
            right: "20px",
            background: "rgba(0,0,0,0.7)",
            border: "none",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            zIndex: 1000,
          }}
        >
          {document.fullscreenElement ? "退出全屏" : "全屏"}
        </button>
        
        {/* CSS 样式来隐藏原生全屏按钮 */}
        <style>
          {`
            /* 隐藏原生全屏按钮 */
            video::-webkit-media-controls-fullscreen-button {
              display: none !important;
            }
            
            /* 隐藏 controls 中的全屏按钮 */
            .react-player video::-webkit-media-controls-fullscreen-button {
              display: none !important;
            }
            
            /* 通用隐藏全屏按钮 */
            button[aria-label*="fullscreen"],
            button[title*="fullscreen"],
            button[aria-label*="Fullscreen"],
            button[title*="Fullscreen"] {
              display: none !important;
            }
          `}
        </style>
      </div>
      
      <FullscreenOverlay show={isFullscreen} />
    </>
  );
};

export default CSSOverrideVideoPlayer; 