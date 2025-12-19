import React, { useState } from 'react';

interface ImageMagnifierProps {
  src: string;
  zoom?: number;
  alt?: string;
}

const ImageMagnifier: React.FC<ImageMagnifierProps> = ({ src, zoom = 2, alt }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState('center');
  const [imageError, setImageError] = useState(false);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (imageError) return;
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted"
      style={{
        backgroundImage: imageError ? 'none' : `url(${src})`,
        backgroundSize: isHovering && !imageError ? `${zoom * 100}%` : 'cover',
        backgroundPosition: isHovering && !imageError ? backgroundPosition : 'center',
      }}
      onMouseEnter={() => !imageError && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-200 ${isHovering && !imageError ? 'opacity-0' : 'opacity-100'
          }`}
        loading="lazy"
        onError={handleImageError}
        decoding="async"
      />
    </div>
  );
};

export default ImageMagnifier;

