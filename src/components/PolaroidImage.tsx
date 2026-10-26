import React from 'react';

interface PolaroidImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  tiltDirection?: 'left' | 'right' | 'none';
}

export const PolaroidImage: React.FC<PolaroidImageProps> = ({
  src,
  alt,
  caption,
  className = '',
  tiltDirection = 'left',
}) => {
  const tiltClass =
    tiltDirection === 'left'
      ? '-rotate-1 hover:rotate-0'
      : tiltDirection === 'right'
      ? 'rotate-1 hover:rotate-0'
      : '';

  return (
    <figure
      className={`relative inline-block bg-white p-3 pb-7 rounded-sm shadow-polaroid transition-transform duration-300 ease-out ${tiltClass} ${className}`}
    >
      <div className="overflow-hidden rounded-xs bg-[#E8DEC7]">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto max-h-96 object-cover select-none filter contrast-[1.02] sepia-[0.08]"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center font-caveat text-lg text-coklat-sedang tracking-wide select-none">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
