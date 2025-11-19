// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import rawLogo from '@/app/prodis.jpeg';

interface ProdisLogoProps {
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export default function ProdisLogo({
  width = rawLogo.width,
  height = rawLogo.height,
  alt = 'Logo PRODIS GPS',
  className,
  priority = false,
}: ProdisLogoProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = rawLogo.src;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isAlmostWhite = r > 245 && g > 245 && b > 245;
        if (isAlmostWhite) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedSrc(canvas.toDataURL('image/png'));
    };
  }, []);

  return (
    <Image
      src={processedSrc || rawLogo}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={Boolean(processedSrc)}
    />
  );
}

