import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import CameraMonitor from './CameraMonitor';
import StatusModal from './StatusModal';

export interface LearningMonitorRef {
  open: () => void;
  close: () => void;
}

const LearningMonitor = forwardRef<LearningMonitorRef>((props, ref) => {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<'normal' | 'pause' | 'fail' | 'error' | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      setRunning(true);
      setStatus(null);
    },
    close: () => {
      setRunning(false);
      setStatus(null);
    }
  }), []);

  const handleStatusChange = (newStatus: 'normal' | 'pause' | 'fail' | 'error') => {
    setStatus(newStatus === 'normal' ? null : newStatus);
    if (newStatus === 'fail' || newStatus === 'error') {
      setRunning(false);
    }
  };

  const handleCloseModal = () => {
    if (status === 'fail' || status === 'error') {
      setRunning(false);
    }
    setStatus(null);
  };

  return (
    <>
      {running && (
        <CameraMonitor running={running} onStatusChange={handleStatusChange} />
      )}
      <StatusModal status={status} onClose={handleCloseModal} />
    </>
  );
});

export default LearningMonitor; 