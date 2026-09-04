import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * THE CATALOGUE-IMAGE STYLE, CARRIED OVER FROM THE BASE44 EXPORT AND OTHERWISE UNTOUCHED.
 *
 * Square tiles in a 2/3/4 grid, a hairline that turns accent on hover, the image scaling inside
 * it, and a full-bleed lightbox with prev/next and a `n / N` footer. Every class string below is
 * the export's, character for character; the file sat here unimported since the strip.
 *
 * TWO PHOTO SHAPES, because the two sources of a photo are not the same thing.
 *
 * - `photo_urls: string[]` is the export's own shape — a ROOM of a house, photographed. The
 *   heading chip names the room.
 * - `photos: {url, title}[]` is the platform's — an ITEMISED catalogue, where every photograph is
 *   one lot with a name and a price behind it. There is no room to name, so the chip is omitted
 *   rather than filled with `Room 1`, and the name travels to the lightbox footer where the
 *   export already had somewhere to put it.
 *
 * **The tile itself is identical either way**, which is the point: a catalogue and a room of a
 * house look the same on this page because they are the same act — photographs of an estate.
 */

export default function SaleRoomGallery({ rooms }) {
  const [lightbox, setLightbox] = useState(null); // { roomIdx, photoIdx }

  /*
   * Remove duplicate photo URLs — globally across all rooms (a URL keeps its first occurrence) and
   * within each room. That is the export's rule and it is kept, for `photo_urls` ONLY.
   *
   * **ITEMS ARE NOT DEDUPED, AND THE DIFFERENCE IS NOT A DETAIL.** A room is a place, so the same
   * photograph appearing twice in a list of rooms is a mistake worth swallowing. An item is a LOT,
   * with a name and a price and a buyer who came for it — and two lots can honestly share one
   * photograph: a pair shot together, a grouped lot, a re-used upload. Deduping there deletes a lot
   * from the page while the card beside it still counts it, so the sale advertises twelve items and
   * shows eleven, with nothing anywhere saying which one went. Measured here: three fixture items
   * sharing one image rendered as one tile.
   *
   * Both shapes are folded into one list of `{url, title}` HERE rather than at four call sites
   * below, so the dedupe, the lightbox arithmetic and the counter cannot disagree about how many
   * photographs a room has.
   */
  const seen = new Set();
  const usable = (photo) => photo && typeof photo.url === "string" && photo.url !== "";
  const dedupedRooms = (rooms || []).map((room) => ({
    ...room,
    photos: [
      ...(room.photos || []).filter(usable),
      ...(room.photo_urls || [])
        .map((url) => ({ url, title: "" }))
        .filter((photo) => {
          if (!usable(photo)) return false;
          if (seen.has(photo.url)) return false;
          seen.add(photo.url);
          return true;
        }),
    ],
  }));

  const openLightbox = (roomIdx, photoIdx) => setLightbox({ roomIdx, photoIdx });
  const closeLightbox = () => setLightbox(null);

  const prevPhoto = () => {
    const { roomIdx, photoIdx } = lightbox;
    const photos = dedupedRooms[roomIdx].photos;
    setLightbox({ roomIdx, photoIdx: (photoIdx - 1 + photos.length) % photos.length });
  };

  const nextPhoto = () => {
    const { roomIdx, photoIdx } = lightbox;
    const photos = dedupedRooms[roomIdx].photos;
    setLightbox({ roomIdx, photoIdx: (photoIdx + 1) % photos.length });
  };

  return (
    <div className="space-y-10">
      {dedupedRooms.map((room, roomIdx) => (
        <div key={roomIdx}>
          {/* NO CHIP WHERE THERE IS NO ROOM. An itemised catalogue has no rooms, and printing
              the fallback `Room 1` over it would label a photograph with a fact nobody stated —
              the same rule `catalogChannel.js` keeps about counts. */}
          {room.room_name && (
            <h3 className="font-heading font-black text-lg uppercase tracking-widest mb-3 flex items-center gap-3">
              <span className="bg-accent text-white text-xs px-2 py-1">{room.room_name}</span>
            </h3>
          )}
          {room.photos && room.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {room.photos.map((photo, photoIdx) => (
                <button
                  key={photoIdx}
                  onClick={() => openLightbox(roomIdx, photoIdx)}
                  className="aspect-square overflow-hidden border border-foreground/10 hover:border-accent transition-colors"
                >
                  <img src={photo.url} alt={photo.title || `${room.room_name || "Sale"} photo ${photoIdx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
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
            src={dedupedRooms[lightbox.roomIdx].photos[lightbox.photoIdx].url}
            alt={dedupedRooms[lightbox.roomIdx].photos[lightbox.photoIdx].title || "Preview"}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 text-white/70 hover:text-white p-2">
            <ChevronRight className="w-8 h-8" />
          </button>
          {/* The export put the ROOM here because a room photo has no name of its own. An item
              does, so its name takes the same slot — the footer is the one place this component
              already had for saying what you are looking at. */}
          <div className="absolute bottom-4 text-white/50 text-xs font-heading uppercase tracking-widest">
            {lightbox.photoIdx + 1} / {dedupedRooms[lightbox.roomIdx].photos.length}
            {(dedupedRooms[lightbox.roomIdx].photos[lightbox.photoIdx].title ||
              dedupedRooms[lightbox.roomIdx].room_name) &&
              ` — ${
                dedupedRooms[lightbox.roomIdx].photos[lightbox.photoIdx].title ||
                dedupedRooms[lightbox.roomIdx].room_name
              }`}
          </div>
        </div>
      )}
    </div>
  );
}