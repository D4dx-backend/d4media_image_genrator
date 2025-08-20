'use client';

import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Edit } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Edit className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <Label className="text-base font-medium text-blue-900">
            Qwen Image Editor
          </Label>
          <p className="text-sm text-blue-700">
            Advanced AI model for precise image editing and modifications
          </p>
        </div>
      </div>
    </Card>
  );
}