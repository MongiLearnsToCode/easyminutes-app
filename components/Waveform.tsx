import React from 'react';

const Waveform = () => {
  return (
    <div className="flex items-center justify-center space-x-1 h-10">
      <span className="w-1 h-4 bg-primary animate-wavey"></span>
      <span className="w-1 h-8 bg-primary animate-wavey animation-delay-200"></span>
      <span className="w-1 h-6 bg-primary animate-wavey animation-delay-400"></span>
      <span className="w-1 h-10 bg-primary animate-wavey animation-delay-600"></span>
      <span className="w-1 h-6 bg-primary animate-wavey animation-delay-800"></span>
      <span className="w-1 h-8 bg-primary animate-wavey animation-delay-1000"></span>
      <span className="w-1 h-4 bg-primary animate-wavey animation-delay-1200"></span>
    </div>
  );
};

export default Waveform;
