import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function SaleRoomGallery({ rooms }) {
  const [lightbox, setLightbox] = useState(null); // { roomIdx, photoIdx }

  // Remove duplicate photo URLs — globally across all rooms (a URL keeps its
  // first occurrence) and within each room.
  const seen = new Set();
  const dedupedRooms = rooms.map((room) => ({
    ...room,
    photo_urls: (room.photo_urls || []).filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    }),
  }));

  const openLightbox = (roomIdx, photoIdx) => setLightbox({ roomIdx, photoIdx });
  const closeLightbox = () => setLightbox(null);

  const prevPhoto = () => {
    const { roomIdx, photoIdx } = lightbox;
    const photos = dedupedRooms[roomIdx].photo_urls;
    setLightbox({ roomIdx, photoIdx: (photoIdx - 1 + photos.length) % photos.length });
  };

  const nextPhoto = () => {
    const { roomIdx, photoIdx } = lightbox;
    const photos = dedupedRooms[roomIdx].photo_urls;
    setLightbox({ roomIdx, photoIdx: (photoIdx + 1) % photos.length });
  };

  return (
    <div className="space-y-10">
      {dedupedRooms.map((room, roomIdx) => (
        <div key={roomIdx}>
          <h3 className="font-heading font-black text-lg uppercase tracking-widest mb-3 flex items-center gap-3">
            <span className="bg-accent text-white text-xs px-2 py-1">{room.room_name || `Room ${roomIdx + 1}`}</span>
          </h3>
          {room.photo_urls && room.photo_urls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {room.photo_urls.map((url, photoIdx) => (
                <button
                  key={photoIdx}
                  onClick={() => openLightbox(roomIdx, photoIdx)}
                  className="aspect-square overflow-hidden border border-foreground/10 hover:border-accent transition-colors"
                >
                  <img src={url} alt={`${room.room_name} photo ${photoIdx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No photos for this room yet.</p>
          )}
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 text-white/70 hover:text-white p-2">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={dedupedRooms[lightbox.roomIdx].photo_urls[lightbox.photoIdx]}
            alt="Preview"
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 text-white/70 hover:text-white p-2">
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-4 text-white/50 text-xs font-heading uppercase tracking-widest">
            {lightbox.photoIdx + 1} / {dedupedRooms[lightbox.roomIdx].photo_urls.length} — {dedupedRooms[lightbox.roomIdx].room_name}
          </div>
        </div>
      )}
    </div>
  );
}