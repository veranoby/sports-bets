import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselViewerProps {
  images: string[];
  title: string;
}

const ImageCarouselViewer: React.FC<ImageCarouselViewerProps> = ({
  images,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`${title} ${currentIndex + 1}`}
          className="w-full h-96 object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicator dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white w-6"
                      : "bg-white/50 hover:bg-white/80"
                  }`}
                  title={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center">
        Imagen {currentIndex + 1} de {images.length}
      </p>
    </div>
  );
};

export default ImageCarouselViewer;
