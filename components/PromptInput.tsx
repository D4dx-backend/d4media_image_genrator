'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface PromptInputProps {
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
}

export default function PromptInput({ prompts, onPromptsChange }: PromptInputProps) {
  const addPrompt = () => {
    if (prompts.length < 10) {
      onPromptsChange([...prompts, '']);
    }
  };

  const removePrompt = (index: number) => {
    if (prompts.length > 1) {
      const newPrompts = prompts.filter((_, i) => i !== index);
      onPromptsChange(newPrompts);
    }
  };

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    onPromptsChange(newPrompts);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Image Editing Prompts ({prompts.length}/10)
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPrompt}
          disabled={prompts.length >= 10}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Prompt
        </Button>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Prompt {index + 1}
              </Label>
              {prompts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrompt(index)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Describe the edit you want to make to the image..."
              value={prompt}
              onChange={(e) => updatePrompt(index, e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Be specific about the changes you want</span>
              <span>{prompt.length}/500</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}