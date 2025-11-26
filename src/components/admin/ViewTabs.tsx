import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Loader2 } from 'lucide-react';
import { ViewKey, Placeholder } from '@/types/product';

interface ViewTabsProps {
  views: ViewKey[];
  activeView: ViewKey;
  viewImages: Record<ViewKey, string | null>;
  placeholderCounts: Record<ViewKey, number>;
  onViewChange: (view: ViewKey) => void;
  onImageUpload: (view: ViewKey, file: File) => void;
  onImageRemove: (view: ViewKey) => void;
  uploadingViews?: Set<ViewKey>;
}

export const ViewTabs = ({
  views,
  activeView,
  viewImages,
  placeholderCounts,
  onViewChange,
  onImageUpload,
  onImageRemove,
  uploadingViews = new Set(),
}: ViewTabsProps) => {
  const handleFileChange = (view: ViewKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(view, file);
    }
  };

  const getViewLabel = (view: ViewKey) => {
    const labels: Record<ViewKey, string> = {
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
    };
    return labels[view] || view.charAt(0).toUpperCase() + view.slice(1);
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {views.map((view) => {
        const isActive = activeView === view;
        const isUploading = uploadingViews.has(view);
        return (
          <div key={view} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className={`text-sm capitalize ${isActive ? 'font-bold' : ''}`}>
                  {getViewLabel(view)} View
                </Label>
                {placeholderCounts[view] > 0 && (
                  <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                    {placeholderCounts[view]}
                  </Badge>
                )}
              </div>
              {viewImages[view] && !isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onImageRemove(view)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(view, e)}
              className="hidden"
              id={`file-input-${view}`}
              disabled={isUploading}
            />
            <Button
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={`w-full transition-all ${
                isActive 
                  ? 'font-bold shadow-md bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
              onClick={() => {
                onViewChange(view);
                if (!viewImages[view] && !isUploading) {
                  document.getElementById(`file-input-${view}`)?.click();
                }
              }}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  <span className="text-xs">Uploading...</span>
                </>
              ) : viewImages[view] ? (
                <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                  ✓ {getViewLabel(view)}
                </span>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-1" />
                  Upload {getViewLabel(view)}
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
};

