/* eslint-disable @next/next/no-img-element -- photos come straight from the
   storage bucket; the small thumbnails are already sized for their slots. */

type PhotoLike = { url: string; thumbUrl?: string | null; color?: string | null };

// A photo tile: the small thumbnail (falls back to the full image for photos
// moved out of old entries), loaded lazily over its average colour so a slow
// network shows soft colour blocks instead of white holes.
export default function PhotoThumb({
  photo,
  full = false,
  alt = "",
  className = "",
  eager = false,
}: {
  photo: PhotoLike;
  full?: boolean;
  alt?: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <span className={`block overflow-hidden ${className}`} style={{ background: photo.color ?? "#f3e6da" }}>
      <img
        src={full ? photo.url : (photo.thumbUrl ?? photo.url)}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="w-full h-full object-cover"
      />
    </span>
  );
}
