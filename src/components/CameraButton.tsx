'use client';

import { useRef, useState } from 'react';

type Props = {
  onResult: (message: string) => void;
  onError: (error: string) => void;
  locationHint?: string;
  disabled?: boolean;
};

export default function CameraButton({ onResult, onError, locationHint, disabled }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 768;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        // strip data:image/jpeg;base64, prefix
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset input so same file can be re-selected
    e.target.value = '';

    setIsLoading(true);
    try {
      const imageBase64 = await resizeImage(file);
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg', locationHint }),
      });
      const data = await res.json();
      onResult(data.message || "I couldn't analyze that photo. Try again!");
    } catch {
      onError("Couldn't analyze the photo. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isLoading}
        title="Take a photo to identify landmarks"
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-150 select-none
          ${isLoading
            ? 'bg-[#282828] opacity-70 cursor-not-allowed animate-pulse'
            : disabled
              ? 'bg-[#282828] opacity-40 cursor-not-allowed'
              : 'bg-[#1a6bb5] hover:bg-[#1558a0] active:scale-95 shadow-[0_0_16px_rgba(26,107,181,0.4)]'
          }`}
      >
        {isLoading ? '⏳' : '📷'}
      </button>
    </>
  );
}
