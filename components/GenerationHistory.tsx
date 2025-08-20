'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GenerationResult {
  id: string;
  prompts: string[];
  model: string;
  referenceImage?: string;
  generatedImages: string[];
  timestamp: Date;
}

interface GenerationHistoryProps {
  history: GenerationResult[];
  onSelectFromHistory: (result: GenerationResult) => void;
}

export default function GenerationHistory({ history, onSelectFromHistory }: GenerationHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Editing History</h3>
          <p className="text-gray-500 text-sm">Your recent edits will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-purple-500" />
        Recent Edits
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((result) => (
          <div
            key={result.id}
            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onSelectFromHistory(result)}
          >
            <div className="flex items-start gap-3">
              {result.generatedImages[0] && (
                <img
                  src={result.generatedImages[0]}
                  alt="Edited"
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {result.prompts.length} prompt{result.prompts.length > 1 ? 's' : ''}: {result.prompts[0]}
                  {result.prompts.length > 1 && '...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {result.generatedImages.length} image{result.generatedImages.length > 1 ? 's' : ''} generated
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFromHistory(result);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}