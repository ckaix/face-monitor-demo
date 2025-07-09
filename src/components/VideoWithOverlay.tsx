import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { createPortal } from "react-dom";

// 覆盖元素，挂在body层级
const FullscreenOverlay: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  
  const overlayElement = (
    <div
      style={{
        position: "fixed",
        top: 40,
        left: 0,
        width: "100vw",
        zIndex: 2147483647, // 使用最大z-index值
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

const VideoWithOverlay: React.FC = () => {
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  console.log(isFullscreen);

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
        console.log(7777, fullscreenElement, playerWrapperRef.current);
        
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

export default VideoWithOverlay; 