import React from "react";
import Image from "next/image";

interface ValenceLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function ValenceLogo({
  className = "",
  size = 22,
}: ValenceLogoProps) {
  // Brand logo aspect ratio is ~5.5 (220x40)
  // Scaled to sleek, balanced height (default 22px) so it fits elegantly in the navbar
  const height = size;
  const width = Math.round(height * 5.5);

  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <Image
        src="/valence-brand-logo.png"
        alt="Valence"
        width={width}
        height={height}
        priority
        style={{ height: `${height}px`, width: "auto" }}
        className="object-contain transition-all duration-200 hover:brightness-110 select-none"
      />
    </div>
  );
}

export default ValenceLogo;
