import Image from "next/image";

export function PhotoNaturelle({
  src,
  alt,
  sizes,
  priority = false,
  plafond,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  plafond?: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={1200}
      sizes={sizes}
      priority={priority}
      className={`block h-auto ${
        plafond ? `mx-auto w-auto max-w-full ${plafond}` : "w-full"
      } ${className}`}
    />
  );
}
