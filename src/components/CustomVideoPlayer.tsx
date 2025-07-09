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
  
  return overlayElement
};

const CustomVideoPlayer: React.FC = () => {
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    function handleFullscreenChange() {
     
        
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
       
      if (
        fullscreenElement &&
        playerWrapperRef.current
      ) {
        console.log(1111,  fullscreenElement &&
            playerWrapperRef.current);
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    }
    console.log(7777, isFullscreen, playerWrapperRef.current,document.fullscreenElement);
    

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value) * duration;
    // 这里需要获取 ReactPlayer 的 ref 来调用 seekTo
    // 暂时用 console.log 演示
    console.log('Seek to:', seekTime);
  };

  return (
    <>
      <div 
       
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div  ref={playerWrapperRef}>
            
        <ReactPlayer
          url="https://www.w3schools.com/html/mov_bbb.mp4"
          controls={false}
          playing={playing}
          onProgress={({ played }) => setProgress(played)}
          onDuration={setDuration}
          width="100%"
          height="360px"
        />
        </div>
        
        {/* 自定义 controls */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* 播放/暂停按钮 */}
          <button
            onClick={() => setPlaying(!playing)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "8px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {playing ? "⏸️" : "▶️"}
          </button>
          
          {/* 进度条 */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={handleSeek}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.3)",
              outline: "none",
            }}
          />
          
          {/* 自定义全屏按钮 */}
          <button
            onClick={handleCustomFullscreen}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {document.fullscreenElement ? "⏹️" : "⛶"}
          </button>
        </div>
      </div>
      
      <FullscreenOverlay show={isFullscreen} />
    </>
  );
};

export default CustomVideoPlayer; 