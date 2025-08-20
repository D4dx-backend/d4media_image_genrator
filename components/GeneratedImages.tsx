'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';

interface GeneratedImagesProps {
  images: string[];
  isLoading: boolean;
}

export default function GeneratedImages({ images, isLoading }: GeneratedImagesProps) {
  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `generated-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <div className="text-center">
          <div className="p-4 bg-purple-100 rounded-full inline-flex mb-4">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
          <h3 className="text-lg font-medium mb-2">Editing Images</h3>
          <p className="text-gray-500">This may take a few moments...</p>
        </div>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Edited Images</h3>
          <p className="text-gray-500">Your edited images will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <h3 className="text-lg font-medium mb-4">Edited Images ({images.length})</h3>
      <div className="space-y-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={imageUrl}
              alt={`Edited ${index + 1}`}
              className="w-full rounded-lg shadow-md"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                onClick={() => downloadImage(imageUrl, index)}
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}