import { useState, useCallback, useEffect } from 'react';
import { ViewTabs } from './ViewTabs';
import { CanvasMockup } from './CanvasMockup';
import { PlaceholderControls } from './PlaceholderControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ViewKey, Placeholder, ViewConfig, DisplacementSettings } from '@/types/product';
import { uploadApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { computeRefinedPolygonPoints } from '@/lib/polygonRefinement';

interface ProductImageConfiguratorProps {
  views: ViewConfig[];
  onViewsChange: (views: ViewConfig[]) => void;
  physicalWidth?: number; // Physical width in inches
  physicalHeight?: number; // Physical height in inches
  physicalLength?: number; // Physical length in inches (for left/right views)
  unit?: 'in' | 'cm'; // Unit for display
  displacementSettings?: DisplacementSettings;
  onDisplacementSettingsChange?: (settings: DisplacementSettings) => void;
}

export const ProductImageConfigurator = ({
  views,
  onViewsChange,
  physicalWidth,
  physicalHeight,
  physicalLength,
  unit = 'in',
  displacementSettings,
  onDisplacementSettingsChange,
}: ProductImageConfiguratorProps) => {
  const [activeView, setActiveView] = useState<ViewKey>('front');
  const [uploadingViews, setUploadingViews] = useState<Set<ViewKey>>(new Set());
  const { toast } = useToast();

  const currentView = views.find(v => v.key === activeView) || {
    key: activeView,
    mockupImageUrl: '',
    placeholders: [],
  };

  const handleImageUpload = useCallback(async (view: ViewKey, file: File) => {
    setUploadingViews(prev => new Set(prev).add(view));

    try {
      // Upload to S3
      const s3Url = await uploadApi.uploadImage(file, 'mockups');

      const updatedViews = views.map(v =>
        v.key === view
          ? { ...v, mockupImageUrl: s3Url }
          : v
      );

      // If view doesn't exist, add it
      if (!views.find(v => v.key === view)) {
        updatedViews.push({
          key: view,
          mockupImageUrl: s3Url,
          placeholders: [],
        });
      }

      onViewsChange(updatedViews);

      toast({
        title: 'Upload successful',
        description: `Mockup image for ${view} view uploaded to S3 successfully`,
      });
    } catch (error) {
      console.error('Error uploading mockup image:', error);
      toast({
        title: 'Upload failed',
        description: `Failed to upload mockup image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setUploadingViews(prev => {
        const next = new Set(prev);
        next.delete(view);
        return next;
      });
    }
  }, [views, onViewsChange, toast]);

  const handleImageRemove = useCallback((view: ViewKey) => {
    const updatedViews = views.map(v =>
      v.key === view
        ? { ...v, mockupImageUrl: '', placeholders: [] }
        : v
    );
    onViewsChange(updatedViews);
  }, [views, onViewsChange]);

  const handlePlaceholderAdd = useCallback(() => {
    // Create a new placeholder centered in inches
    // Default: 6" x 6" placeholder centered on a 20" x 24" product
    const defaultWidthIn = 6; // 6 inches wide
    const defaultHeightIn = 6; // 6 inches tall
    const isSideView = activeView === 'left' || activeView === 'right';
    const defaultXIn = (isSideView ? (physicalLength || 18) : (physicalWidth || 20)) / 2 - defaultWidthIn / 2;
    const defaultYIn = (physicalHeight || 24) / 2 - defaultHeightIn / 2;

    const newPlaceholder: Placeholder = {
      id: `${activeView}-${Date.now()}`,
      xIn: defaultXIn,
      yIn: defaultYIn,
      widthIn: defaultWidthIn,
      heightIn: defaultHeightIn,
      rotationDeg: 0,
      scale: 1.0,
      lockSize: false,
    };

    const updatedViews = views.map(v =>
      v.key === activeView
        ? { ...v, placeholders: [...v.placeholders, newPlaceholder] }
        : v
    );

    // If view doesn't exist, create it
    if (!views.find(v => v.key === activeView)) {
      updatedViews.push({
        key: activeView,
        mockupImageUrl: currentView.mockupImageUrl,
        placeholders: [newPlaceholder],
      });
    }

    onViewsChange(updatedViews);
  }, [activeView, views, currentView.mockupImageUrl, onViewsChange, physicalWidth, physicalHeight, physicalLength]);

  // Create a placeholder from a magnetic lasso selection (dimensions already in inches)
  const handleLassoPlaceholderCreate = useCallback(
    (placeholderWithoutId: Omit<Placeholder, 'id'>) => {
      const id = `${activeView}-${Date.now()}`;
      const newPlaceholder: Placeholder = {
        id,
        ...placeholderWithoutId,
      };

      const updatedViews = views.map(v =>
        v.key === activeView
          ? { ...v, placeholders: [...v.placeholders, newPlaceholder] }
          : v
      );

      if (!views.find(v => v.key === activeView)) {
        updatedViews.push({
          key: activeView,
          mockupImageUrl: currentView.mockupImageUrl,
          placeholders: [newPlaceholder],
        });
      }

      onViewsChange(updatedViews);
      return id;
    },
    [activeView, views, currentView.mockupImageUrl, onViewsChange],
  );

  const handlePlaceholderChange = useCallback((id: string, updates: Partial<Placeholder>) => {
    const updatedViews = views.map(v =>
      v.key === activeView
        ? {
          ...v,
          placeholders: v.placeholders.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }
        : v
    );
    onViewsChange(updatedViews);
  }, [activeView, views, onViewsChange]);

  // Ensure renderPolygonPoints are computed for placeholders with shapeRefinement
  useEffect(() => {
    const needsUpdate = views.some(view =>
      view.placeholders.some(p =>
        p.shapeType === 'polygon' &&
        p.polygonPoints &&
        p.polygonPoints.length >= 3 &&
        p.shapeRefinement &&
        (!p.renderPolygonPoints || p.renderPolygonPoints.length === 0)
      )
    );

    if (needsUpdate) {
      const updatedViews = views.map(view => ({
        ...view,
        placeholders: view.placeholders.map(p => {
          if (
            p.shapeType === 'polygon' &&
            p.polygonPoints &&
            p.polygonPoints.length >= 3 &&
            p.shapeRefinement &&
            (!p.renderPolygonPoints || p.renderPolygonPoints.length === 0)
          ) {
            const renderPoints = computeRefinedPolygonPoints(
              p.polygonPoints,
              p.shapeRefinement
            );
            return { ...p, renderPolygonPoints: renderPoints };
          }
          return p;
        }),
      }));
      onViewsChange(updatedViews);
    }
  }, [views, onViewsChange]);

  const handlePlaceholderDelete = useCallback((id: string) => {
    const updatedViews = views.map(v =>
      v.key === activeView
        ? { ...v, placeholders: v.placeholders.filter(p => p.id !== id) }
        : v
    );
    onViewsChange(updatedViews);
  }, [activeView, views, onViewsChange]);

  const [activePlaceholderId, setActivePlaceholderId] = useState<string | null>(null);

  const placeholderCounts: Record<ViewKey, number> = {
    front: views.find(v => v.key === 'front')?.placeholders.length || 0,
    back: views.find(v => v.key === 'back')?.placeholders.length || 0,
    left: views.find(v => v.key === 'left')?.placeholders.length || 0,
    right: views.find(v => v.key === 'right')?.placeholders.length || 0,
  };

  const viewImages: Record<ViewKey, string | null> = {
    front: views.find(v => v.key === 'front')?.mockupImageUrl || null,
    back: views.find(v => v.key === 'back')?.mockupImageUrl || null,
    left: views.find(v => v.key === 'left')?.mockupImageUrl || null,
    right: views.find(v => v.key === 'right')?.mockupImageUrl || null,
  };

  const activePlaceholder = currentView.placeholders.find(p => p.id === activePlaceholderId) || null;

  return (
    <div className="space-y-4">
      <ViewTabs
        views={['front', 'back', 'left', 'right']}
        activeView={activeView}
        viewImages={viewImages}
        placeholderCounts={placeholderCounts}
        onViewChange={setActiveView}
        onImageUpload={handleImageUpload}
        onImageRemove={handleImageRemove}
        uploadingViews={uploadingViews}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <CanvasMockup
          mockupImageUrl={currentView.mockupImageUrl}
          placeholders={currentView.placeholders}
          activePlaceholderId={activePlaceholderId}
          onPlaceholderChange={handlePlaceholderChange}
          onPlaceholderSelect={setActivePlaceholderId}
          onPlaceholderAdd={handlePlaceholderAdd}
          onPlaceholderDelete={handlePlaceholderDelete}
          onLassoPlaceholderCreate={handleLassoPlaceholderCreate}
          canvasWidth={800}
          canvasHeight={600}
          physicalWidth={(activeView === 'left' || activeView === 'right') ? physicalLength : physicalWidth}
          physicalHeight={physicalHeight}
          unit={unit}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Placeholder Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <PlaceholderControls
              placeholder={activePlaceholder}
              onUpdate={(updates) => {
                if (activePlaceholderId) {
                  handlePlaceholderChange(activePlaceholderId, updates);
                }
              }}
              unit={unit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

