import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ViewKey } from '@/types/product';

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
  uploadingViews,
}: ViewTabsProps) => {

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
        const hasImage = !!viewImages[view];
        const isUploading = uploadingViews?.has(view);
        const inputId = `view-upload-${view}`;

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
              {hasImage && (
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

            <Button
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={`w-full transition-all ${isActive
                  ? 'font-bold shadow-md bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
                }`}
              onClick={() => {
                if (hasImage) {
                  onViewChange(view);
                } else {
                  const input = document.getElementById(inputId) as HTMLInputElement | null;
                  if (input && !isUploading) {
                    input.click();
                  }
                }
              }}
            >
              {hasImage ? (
                <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                  ✓ {getViewLabel(view)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {isUploading ? 'Uploading…' : getViewLabel(view)}
                </span>
              )}
            </Button>

            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                onImageUpload(view, file);
                onViewChange(view);
                event.target.value = '';
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
