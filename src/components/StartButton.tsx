import React from 'react';

interface StartButtonProps {
  onStart: () => void;
}

const StartButton: React.FC<StartButtonProps> = ({ onStart }) => {
  return (
    <button onClick={onStart} style={{ fontSize: 20, padding: '10px 30px' }}>
      开始课程
    </button>
  );
};

export default StartButton; 