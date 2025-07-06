import React from 'react';

interface StatusModalProps {
  status: 'pause' | 'fail' | 'error' | null;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ status, onClose }) => {
  if (!status) return null;
  let message = '';
  if (status === 'pause') message = '检测到学习者离开，课程已暂停';
  if (status === 'fail') message = '暂停超时，课程失败';
  if (status === 'error') message = '未检测到摄像头或摄像头打开失败';
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 8, minWidth: 300, textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 20 }}>{message}</div>
        <button onClick={onClose} style={{ fontSize: 18, padding: '6px 24px' }}>关闭</button>
      </div>
    </div>
  );
};

export default StatusModal; 