import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface UploadPanelProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  imagePreview: string[] | null;
  onImageClick: (imageUrl: string) => void;
  selectedPlaceholderId: string | null;
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onFileUpload,
  onUploadClick,
  imagePreview,
  onImageClick,
  selectedPlaceholderId,
  placeholders,
}) => {
  return (
    <div className="p-4 space-y-4">
      {placeholders.length > 1 && (
        <div className="p-3 bg-muted rounded-lg border">
          <Label className="text-xs font-semibold text-foreground mb-1 block">
            {selectedPlaceholderId
              ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
              : 'Select a placeholder on canvas first'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {selectedPlaceholderId
              ? 'Click an image below to add it to the selected placeholder'
              : 'Click a placeholder on the canvas, then select an image'}
          </p>
        </div>
      )}
      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
        Upload Image
      </Label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onFileUpload}
        className="hidden"
        id="file-upload"
      />
      <Button
        variant="default"
        className="w-full justify-start gap-2"
        onClick={onUploadClick}
      >
        <Upload className="w-4 h-4" />
        Choose Files (Multiple)
      </Button>
      <div className="text-xs text-muted-foreground">
        <p>Supported formats: PNG, JPG, SVG</p>
        <p>Max size: 100MB per file</p>
        <p>Select multiple files at once</p>
      </div>

      {imagePreview && imagePreview.length > 0 && (
        <div className="mt-4">
          <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
            Uploaded Images ({imagePreview.length})
          </Label>
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {imagePreview.map((image, index: number) => (
              <div
                key={index}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                onClick={() => onImageClick(image)}
                title="Click to add to canvas"
              >
                <img
                  src={image}
                  alt={`Uploaded Image ${index + 1}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to Add
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

