import React, { useState, useRef } from "react";
import { uploadsAPI } from "../../services/api";
import { Camera, X, Loader } from "lucide-react";

interface ImageGalleryUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

const ImageGalleryUpload: React.FC<ImageGalleryUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  label = "Galería de Imágenes",
}) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setErrors({});
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      if (newImages.length >= maxImages) {
        setErrors({
          general: `Máximo ${maxImages} imágenes permitidas`,
        });
        break;
      }

      const file = files[i];

      // Validate file type and size
      if (!file.type.startsWith("image/")) {
        setErrors({
          ...errors,
          [file.name]: "Solo se permiten archivos de imagen",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          [file.name]: "La imagen no puede superar los 5MB",
        });
        continue;
      }

      // Upload image
      try {
        setUploadingIndex(newImages.length);

        const uploadResponse = await uploadsAPI.uploadImage(file);
        if (uploadResponse.success && uploadResponse.data?.url) {
          newImages.push(uploadResponse.data.url);
        } else {
          setErrors({
            ...errors,
            [file.name]: uploadResponse.error || "Error al subir la imagen",
          });
        }
      } catch (error) {
        setErrors({
          ...errors,
          [file.name]: "Error al subir la imagen",
        });
      } finally {
        setUploadingIndex(null);
      }
    }

    onImagesChange(newImages);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>

        {errors.general && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-3 text-sm">
            {errors.general}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="relative group">
              <img
                src={image}
                alt={`Galería ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 rounded-lg bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
          ))}

          {/* Upload Button */}
          {images.length < maxImages && (
            <label className="relative cursor-pointer">
              <div className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors">
                {uploadingIndex !== null ? (
                  <>
                    <Loader className="w-6 h-6 text-gray-400 animate-spin mb-1" />
                    <span className="text-xs text-gray-500">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 text-center px-1">
                      Agregar imagen
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={uploadingIndex !== null}
              />
            </label>
          )}
        </div>

        {/* Counter */}
        <p className="text-xs text-gray-500">
          {images.length} de {maxImages} imágenes
        </p>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG o WebP. Máximo 5MB por imagen.
        </p>
      </div>
    </div>
  );
};

export default ImageGalleryUpload;
