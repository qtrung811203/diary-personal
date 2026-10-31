"use client";

import { useRef, useState, type ReactNode } from "react";

// A button that opens the phone's camera (capture) or photo library; desktop
// gets a file dialog. The inputs must be clicked straight from the tap for iOS
// to allow it.
export default function PhotoPicker({
  onPick,
  className,
  title = "Thêm ảnh",
  children,
}: {
  onPick: (files: File[]) => void;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  function toggle() {
    if (pos) return setPos(null);
    // Desktop has no camera option: go straight to the file dialog.
    if (!window.matchMedia("(pointer: coarse)").matches) return libraryRef.current?.click();
    const r = btnRef.current!.getBoundingClientRect();
    const left = Math.min(Math.max(r.left, 8), window.innerWidth - 220);
    setPos(r.top > window.innerHeight / 2 ? { left, bottom: window.innerHeight - r.top + 8 } : { left, top: r.bottom + 8 });
  }

  function chosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setPos(null);
    if (files.length) onPick(files);
  }

  const item = "w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold text-[#3a332c] hover:bg-[#fff0f4] flex items-center gap-2";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
        className={className}
      >
        {children}
      </button>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={chosen} />
      <input ref={libraryRef} type="file" accept="image/*" multiple className="hidden" onChange={chosen} />
      {pos && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={(e) => e.preventDefault()} onClick={() => setPos(null)} />
          <div
            className="fixed z-50 w-[210px] rounded-2xl border border-[#e7ddd0] bg-white p-1.5 shadow-xl"
            style={pos}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button type="button" className={item} onClick={() => cameraRef.current?.click()}>
              📷 Chụp ảnh
            </button>
            <button type="button" className={item} onClick={() => libraryRef.current?.click()}>
              🖼 Chọn từ thư viện
            </button>
          </div>
        </>
      )}
    </>
  );
}
