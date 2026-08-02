'use client';

import React, { useState, useEffect } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleSkip = () => {
    onComplete();
  };

  const handleVideoEnd = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Fullscreen Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="h-full w-full object-cover"
        onEnded={handleVideoEnd}
      >
        <source src="/intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute right-6 top-6 z-10 rounded-lg bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black"
      >
        Skip
      </button>
    </div>
  );
}
