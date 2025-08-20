'use client';

import { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  selectedImage: File | null;
}

export default function ImageUpload({ onImageSelect, selectedImage }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  }, [onImageSelect]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onImageSelect(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    onImageSelect(null);
    setPreviewUrl(null);
  };

  if (selectedImage && previewUrl) {
    return (
      <Card className="relative group">
        <img
          src={previewUrl}
          alt="Reference"
          className="w-full h-64 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <Button
            onClick={removeImage}
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-white text-sm font-medium">
            {selectedImage.name}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`relative border-2 border-dashed transition-all duration-200 cursor-pointer ${
        dragActive 
          ? 'border-purple-400 bg-purple-50' 
          : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 bg-purple-100 rounded-full mb-4">
          <Upload className="h-8 w-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Image to Edit
        </h3>
        <p className="text-gray-500 mb-4">
          Upload the image you want to edit with AI
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ImageIcon className="h-4 w-4" />
          <span>PNG, JPG, JPEG up to 10MB</span>
        </div>
      </div>
    </Card>
  );
}