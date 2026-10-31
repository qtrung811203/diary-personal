import type { PhotoLayout } from "@/lib/photos";

export const LAYOUT_INFO: Record<PhotoLayout, { name: string; hint: string }> = {
  cover: { name: "Bìa lớn", hint: "Ảnh được chọn làm bìa hiện to đầu bài, các ảnh còn lại nhỏ bên dưới." },
  grid: { name: "Lưới", hint: "Tất cả ảnh xếp thành lưới đều nhau dưới bài viết." },
  polaroid: { name: "Polaroid", hint: "Ảnh như những tấm polaroid viền trắng, nghiêng nhẹ." },
};

// Little pastel sketches of each layout.
function Sketch({ layout }: { layout: PhotoLayout }) {
  const a = "bg-gradient-to-br from-[#f4a6b8] to-[#e8829e]";
  if (layout === "cover")
    return (
      <div className="flex flex-col gap-1 w-12">
        <div className={`h-7 rounded-md ${a}`} />
        <div className="flex gap-1">
          <div className="h-2.5 flex-1 rounded-sm bg-[#a8dcd1]" />
          <div className="h-2.5 flex-1 rounded-sm bg-[#f8c79a]" />
          <div className="h-2.5 flex-1 rounded-sm bg-[#cdb8ec]" />
        </div>
      </div>
    );
  if (layout === "grid")
    return (
      <div className="grid grid-cols-2 gap-1 w-12">
        <div className={`h-[22px] rounded-md ${a}`} />
        <div className="h-[22px] rounded-md bg-[#cdb8ec]" />
        <div className="h-[22px] rounded-md bg-[#a8dcd1]" />
        <div className="h-[22px] rounded-md bg-[#f8c79a]" />
      </div>
    );
  return (
    <div className="relative w-12 h-11">
      <div className="absolute left-0 top-1 w-7 h-8 bg-white p-0.5 pb-2 shadow-sm -rotate-6">
        <div className={`h-full ${a}`} />
      </div>
      <div className="absolute right-0 top-0 w-7 h-8 bg-white p-0.5 pb-2 shadow-sm rotate-6">
        <div className="h-full bg-[#a8dcd1]" />
      </div>
    </div>
  );
}

export default function PhotoLayoutPicker({
  value,
  onChange,
}: {
  value: PhotoLayout;
  onChange: (v: PhotoLayout) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(LAYOUT_INFO) as PhotoLayout[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className={`rounded-xl border-2 bg-white px-1 pt-3 pb-2 flex flex-col items-center gap-2 text-[11.5px] font-semibold text-[#3a332c] transition-colors ${
              value === l ? "border-[#e8829e]" : "border-transparent hover:border-[#ffd1de]"
            }`}
          >
            <Sketch layout={l} />
            {LAYOUT_INFO[l].name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-[#7a6f62]">
        {LAYOUT_INFO[value].name}: {LAYOUT_INFO[value].hint.charAt(0).toLowerCase() + LAYOUT_INFO[value].hint.slice(1)}
      </p>
    </div>
  );
}
