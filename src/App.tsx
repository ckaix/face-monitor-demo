// import { useState, useCallback } from 'react';
// import './App.css';
// import StartButton from './components/StartButton';
// import CameraMonitor from './components/CameraMonitor';
// import StatusModal from './components/StatusModal';

// function App() {
//   const [started, setStarted] = useState(false);
//   const [status, setStatus] = useState<'normal' | 'pause' | 'fail' | null>(null);

//   const handleStart = () => {
//     setStarted(true);
//     setStatus(null);
//   };

//   const handleStatusChange = useCallback((newStatus: 'normal' | 'pause' | 'fail') => {
//     setStatus(newStatus === 'normal' ? null : newStatus);
//   }, []);

//   const handleCloseModal = () => {
//     if (status === 'fail') {
//       setStarted(false);
//     }
//     setStatus(null);
//   };

//   return (
//     <div className="App" style={{ padding: 40 }}>
//       <h1>AI 课程学习监控演示</h1>
//       {!started && <StartButton onStart={handleStart} />}
//       {started && (
//         <CameraMonitor running={started && !status} onStatusChange={handleStatusChange} />
//       )}
//       <StatusModal status={status === null ? null : status} onClose={handleCloseModal} />
//     </div>
//   );
// }

// export default App;
// import { useRef } from 'react';
// import './App.css';
// import LearningMonitor, { LearningMonitorRef } from './components/LearningMonitor';

// function App() {
//   const monitorRef = useRef<LearningMonitorRef>(null);

//   return (
//     <div className="App" style={{ padding: 40 }}>
//       <h1>AI 课程学习监控演示（超级组件版）</h1>
//       <button style={{ fontSize: 20, padding: '10px 30px' }} onClick={() => monitorRef.current?.open()}>
//         开始课程
//       </button>
//       <LearningMonitor ref={monitorRef} />
//     </div>
//   );
// }

// export default App;


import { useRef } from 'react';
import './App.css';
import LearningMonitor from './components/LearningMonitor';
import type { LearningMonitorRef } from './components/LearningMonitor';

function App() {
  const monitorRef = useRef<LearningMonitorRef>(null);

  return (
    <div className="App" style={{ padding: 40 }}>
      <h1>AI 课程学习监控演示（组合组件版）</h1>
      <button style={{ fontSize: 20, padding: '10px 30px', marginRight: 16 }} onClick={() => monitorRef.current?.open()}>
        开始课程
      </button>
      <button style={{ fontSize: 20, padding: '10px 30px' }} onClick={() => monitorRef.current?.close()}>
        结束监控
      </button>
      <LearningMonitor ref={monitorRef} />
    </div>
  );
}

export default App;
