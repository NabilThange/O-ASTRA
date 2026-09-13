'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useWebGPU } from '@/hooks/useWebGPU';
import { DEFAULT_QR_CONTENT } from '@/lib/qr/constants';

export default function CherryBlossomQRCode() {
  const [isFlat, setIsFlat] = useState(false);
  const [gpuSupported, setGpuSupported] = useState<boolean | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 520 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isFlatRef = useRef(false);

  // Measure the canvas wrapper area
  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Check GPU support on first mount
  useEffect(() => {
    setGpuSupported(!!((navigator as unknown as { gpu?: unknown }).gpu));
  }, []);

  const toggleFlat = useCallback(() => {
    isFlatRef.current = !isFlatRef.current;
    setIsFlat(isFlatRef.current);
  }, []);

  useWebGPU({
    canvasRef,
    canvasWidth: dimensions.width,
    canvasHeight: dimensions.height,
    qrContent: DEFAULT_QR_CONTENT,
    isFlat: isFlatRef,
  });

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#f7f7f7' }}
    >
      {/* WebGPU Not Supported Warning */}
      {gpuSupported === false && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f7f7f7]">
          <div className="mx-4 max-w-sm rounded-2xl bg-white px-8 py-10 text-center shadow-xl">
            <div className="mb-4 text-5xl">🌸</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              WebGPU Required
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              This animation uses WebGPU for rendering. Please open this page in{' '}
              <strong>Chrome 113+</strong>, <strong>Edge 113+</strong>, or{' '}
              <strong>Safari 17+</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div ref={wrapperRef} className="relative h-full w-full">
        <canvas
          ref={canvasRef}
          onClick={toggleFlat}
          className="h-full w-full cursor-pointer"
          style={{ display: 'block', touchAction: 'none' }}
          aria-label="Cherry blossom tree QR code – click to toggle flat view"
        />

        {/* Toggle hint badge */}
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 select-none items-center gap-2
                     rounded-full bg-white/70 px-4 py-1.5 text-xs text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-500"
        >
          <span className="text-sm">{isFlat ? '🔍' : '🌸'}</span>
          <span>{isFlat ? 'Flat view — scannable QR' : 'Click to reveal QR code'}</span>
        </div>
      </div>
    </div>
  );
}
