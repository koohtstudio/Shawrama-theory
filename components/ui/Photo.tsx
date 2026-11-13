import Image from "next/image";
import { photoMeta } from "@/lib/photos";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Fills a positioned, sized parent. Adds a blur placeholder when we have one (local photos). */
export function Photo({ src, alt, sizes, priority, className = "" }: Props) {
  const meta = photoMeta(src);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder={meta ? "blur" : "empty"}
      blurDataURL={meta?.blur}
      className={`object-cover ${className}`}
    />
  );
}
