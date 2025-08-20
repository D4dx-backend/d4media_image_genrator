'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import PromptInput from '@/components/PromptInput';
import ModelSelector from '@/components/ModelSelector';
import GeneratedImages from '@/components/GeneratedImages';
import GenerationHistory from '@/components/GenerationHistory';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Edit, Image as ImageIcon } from 'lucide-react';

interface GenerationResult {
  id: string;
  prompts: string[];
  model: string;
  referenceImage?: string;
  generatedImages: string[];
  timestamp: Date;
}

export default function Home() {
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [prompts, setPrompts] = useState(['']);
  const [selectedModel] = useState('qwen/qwen-image-edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateInputs = () => {
    const validPrompts = prompts.filter(p => p.trim());
    
    if (validPrompts.length === 0) {
      return 'Please enter at least one prompt';
    }

    if (!referenceImage) {
      return 'Please upload a reference image for editing';
    }

    // Client-side file validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (referenceImage.size > maxSize) {
      return 'Image file must be less than 10MB';
    }
    
    if (!allowedTypes.includes(referenceImage.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }

    // Validate prompts
    for (const prompt of validPrompts) {
      if (prompt.length > 1000) {
        return 'Each prompt must be less than 1000 characters';
      }
      
      // Basic content filtering
      const forbiddenWords = ['nude', 'naked', 'nsfw', 'explicit', 'sexual', 'violence', 'violent'];
      const lowerPrompt = prompt.toLowerCase();
      
      for (const word of forbiddenWords) {
        if (lowerPrompt.includes(word)) {
          return 'Prompt contains inappropriate content';
        }
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    const validPrompts = prompts.filter(p => p.trim());
    setIsGenerating(true);
    setError(null);

    try {
      const allGeneratedImages: string[] = [];

      for (const prompt of validPrompts) {
        const formData = new FormData();
        formData.append('prompt', prompt.trim());
        formData.append('model', selectedModel);
        formData.append('image', referenceImage!);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        try {
                  const response = await fetch('/api/generate', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            // Don't set Content-Type header - let the browser set it with boundary for FormData
          }
        });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorMessage = 'Failed to generate image';
            
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If JSON parsing fails, use status-based message
              if (response.status === 429) {
                errorMessage = 'Rate limit exceeded. Please wait before trying again.';
              } else if (response.status === 400) {
                errorMessage = 'Invalid request. Please check your inputs.';
              } else if (response.status === 408) {
                errorMessage = 'Request timed out. Please try again.';
              } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
              }
            }
            
            throw new Error(errorMessage);
          }

          const data = await response.json();
          if (data.images && data.images.length > 0) {
            allGeneratedImages.push(...data.images);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          
          throw fetchError;
        }
      }
      
      if (allGeneratedImages.length === 0) {
        throw new Error('No images were generated. Please try again.');
      }
      
      setGeneratedImages(allGeneratedImages);
      
      const newResult: GenerationResult = {
        id: Date.now().toString(),
        prompts: validPrompts,
        model: selectedModel,
        referenceImage: referenceImage ? URL.createObjectURL(referenceImage) : undefined,
        generatedImages: allGeneratedImages,
        timestamp: new Date(),
      };
      
      setGenerationHistory(prev => [newResult, ...prev]);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
              <Edit className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Image Editor
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Edit and transform your images with AI precision. Upload an image and describe the changes you want to make.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-500" />
                Image to Edit (Required)
              </h2>
              <ImageUpload
                onImageSelect={setReferenceImage}
                selectedImage={referenceImage}
              />
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Editing Settings</h2>
              <div className="space-y-4">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={() => {}}
                />
                <PromptInput
                  prompts={prompts}
                  onPromptsChange={setPrompts}
                />
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompts.some(p => p.trim()) || !referenceImage}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Editing Images...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-5 w-5" />
                    Edit Images ({prompts.filter(p => p.trim()).length})
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <GeneratedImages
              images={generatedImages}
              isLoading={isGenerating}
            />
            
            <GenerationHistory
              history={generationHistory}
              onSelectFromHistory={(result) => {
                setPrompts(result.prompts);
                setGeneratedImages(result.generatedImages);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}