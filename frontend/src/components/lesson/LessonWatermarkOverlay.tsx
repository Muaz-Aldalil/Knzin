'use client';

import React, { useEffect, useRef } from 'react';
import { WatermarkData } from '@/hooks/useLessonPlayback';

interface LessonWatermarkOverlayProps {
  watermark: WatermarkData | null;
}

export function LessonWatermarkOverlay({ watermark }: LessonWatermarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!watermark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Watermark string
    const watermarkText = `${watermark.account_email} • ${watermark.learner_code} • ${watermark.rendered_at}`;

    let posX = 50;
    let posY = 50;
    let speedX = 0.4;
    let speedY = 0.3;

    const resizeCanvas = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move watermark
      posX += speedX;
      posY += speedY;

      // Bounce on edges
      const textWidth = ctx.measureText(watermarkText).width || 200;
      if (posX + textWidth >= canvas.width - 20 || posX <= 20) {
        speedX = -speedX;
      }
      if (posY >= canvas.height - 20 || posY <= 40) {
        speedY = -speedY;
      }

      // Draw subtle drifting anti-piracy text
      ctx.save();
      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(watermarkText, posX, posY);

      // Draw secondary faint watermark in opposite quadrant
      const oppX = (canvas.width - posX - textWidth + canvas.width) % Math.max(1, canvas.width - textWidth);
      const oppY = (canvas.height - posY + canvas.height) % Math.max(1, canvas.height - 40);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillText(watermarkText, oppX, oppY);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [watermark]);

  if (!watermark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      aria-hidden="true"
    />
  );
}
