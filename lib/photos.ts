import { PHOTOS } from "@/lib/photos.generated";

export function photoMeta(src: string | null | undefined) {
  return src ? PHOTOS[src] : undefined;
}
