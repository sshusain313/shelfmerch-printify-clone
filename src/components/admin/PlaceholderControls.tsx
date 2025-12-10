import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Placeholder } from '@/types/product';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import { computeRefinedPolygonPoints } from '@/lib/polygonRefinement';

interface PlaceholderControlsProps {
  placeholder: Placeholder | null;
  onUpdate: (updates: Partial<Placeholder>) => void;
  unit?: 'in' | 'cm';
}

export const PlaceholderControls = ({ placeholder, onUpdate, unit = 'in' }: PlaceholderControlsProps) => {
  if (!placeholder) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Select a placeholder to edit its properties
      </div>
    );
  }

  const unitLabel = unit === 'cm' ? 'cm' : '"';
  const formatValue = (value: number) => {
    return value.toFixed(1);
  };
  
  const formatInputValue = (value: number): string => {
    // Round to 1 decimal place for display in input
    if (isNaN(value)) return '0';
    const rounded = Math.round(value * 10) / 10;
    // Remove trailing zero if it's a whole number
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  };

  const lockSize = placeholder.lockSize ?? false;
  const scale = placeholder.scale ?? 1.0;

  return (
    <div className="space-y-4">
      {/* Lock Size Checkbox */}
      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
        <Checkbox
          id="lockSize"
          checked={lockSize}
          onCheckedChange={(checked) => {
            onUpdate({ lockSize: checked === true });
          }}
        />
        <Label 
          htmlFor="lockSize" 
          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
        >
          {lockSize ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          Lock print size (inches)
        </Label>
      </div>

      {lockSize && (
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-900">
          Print size is locked. Dragging handles will only change visual scale, not actual print dimensions.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="x">X Position ({unitLabel})</Label>
          <Input
            id="x"
            type="number"
            value={formatInputValue(placeholder.xIn)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onUpdate({ xIn: val });
              }
            }}
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="y">Y Position ({unitLabel})</Label>
          <Input
            id="y"
            type="number"
            value={formatInputValue(placeholder.yIn)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onUpdate({ yIn: val });
              }
            }}
            step="0.1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">
            Width ({unitLabel}) {lockSize && '🔒'}
          </Label>
          <Input
            id="width"
            type="number"
            value={formatInputValue(placeholder.widthIn)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                // When manually typing, update widthIn and reset scale to 1
                onUpdate({ widthIn: val, scale: 1.0 });
              }
            }}
            min="0.1"
            step="0.1"
            disabled={lockSize}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">
            Height ({unitLabel}) {lockSize && '🔒'}
          </Label>
          <Input
            id="height"
            type="number"
            value={formatInputValue(placeholder.heightIn)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                // When manually typing, update heightIn and reset scale to 1
                onUpdate({ heightIn: val, scale: 1.0 });
              }
            }}
            min="0.1"
            step="0.1"
            disabled={lockSize}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rotation">Rotation (degrees)</Label>
        <Input
          id="rotation"
          type="number"
          value={placeholder.rotationDeg}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              onUpdate({ rotationDeg: val });
            }
          }}
          min="0"
          max="360"
          step="1"
        />
      </div>

      {/* Display Scale Info */}
      {scale !== 1.0 && (
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Visual scale: {(scale * 100).toFixed(0)}%
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <div className="text-xs text-muted-foreground font-mono">
          X: {formatValue(placeholder.xIn)}{unitLabel} | Y: {formatValue(placeholder.yIn)}{unitLabel} | 
          W: {formatValue(placeholder.widthIn)}{unitLabel} | H: {formatValue(placeholder.heightIn)}{unitLabel} | 
          R: {placeholder.rotationDeg}°
        </div>
      </div>

      {/* Shape Refinement Section for Polygon Placeholders */}
      {placeholder.shapeType === 'polygon' && placeholder.polygonPoints && placeholder.polygonPoints.length >= 3 && (
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Shape Refinement</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onUpdate({
                  shapeRefinement: {
                    smoothness: 0,
                    bulgeStrength: 0,
                    roundCorners: 0,
                  },
                  renderPolygonPoints: undefined,
                });
              }}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className="space-y-4">
            {/* Smoothness Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Smoothness</Label>
                <span className="text-xs text-muted-foreground">
                  {placeholder.shapeRefinement?.smoothness ?? 0}%
                </span>
              </div>
              <Slider
                value={[placeholder.shapeRefinement?.smoothness ?? 0]}
                onValueChange={([value]) => {
                  const currentRefinement = placeholder.shapeRefinement || {
                    smoothness: 0,
                    bulgeStrength: 0,
                    roundCorners: 0,
                  };
                  const newRefinement = { ...currentRefinement, smoothness: value };
                  
                  // Recompute renderPolygonPoints
                  const renderPoints = computeRefinedPolygonPoints(
                    placeholder.polygonPoints!,
                    newRefinement
                  );
                  
                  onUpdate({
                    shapeRefinement: newRefinement,
                    renderPolygonPoints: renderPoints,
                  });
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0 = original polygon, 100 = very smooth curve
              </p>
            </div>

            {/* Bulge Strength Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bulge Strength</Label>
                <span className="text-xs text-muted-foreground">
                  {placeholder.shapeRefinement?.bulgeStrength ?? 0}%
                </span>
              </div>
              <Slider
                value={[placeholder.shapeRefinement?.bulgeStrength ?? 0]}
                onValueChange={([value]) => {
                  const currentRefinement = placeholder.shapeRefinement || {
                    smoothness: 0,
                    bulgeStrength: 0,
                    roundCorners: 0,
                  };
                  const newRefinement = { ...currentRefinement, bulgeStrength: value };
                  
                  // Recompute renderPolygonPoints
                  const renderPoints = computeRefinedPolygonPoints(
                    placeholder.polygonPoints!,
                    newRefinement
                  );
                  
                  onUpdate({
                    shapeRefinement: newRefinement,
                    renderPolygonPoints: renderPoints,
                  });
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0 = neutral, 100 = exaggerate convex regions
              </p>
            </div>

            {/* Round Corners Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Round Corners</Label>
                <span className="text-xs text-muted-foreground">
                  {placeholder.shapeRefinement?.roundCorners ?? 0}%
                </span>
              </div>
              <Slider
                value={[placeholder.shapeRefinement?.roundCorners ?? 0]}
                onValueChange={([value]) => {
                  const currentRefinement = placeholder.shapeRefinement || {
                    smoothness: 0,
                    bulgeStrength: 0,
                    roundCorners: 0,
                  };
                  const newRefinement = { ...currentRefinement, roundCorners: value };
                  
                  // Recompute renderPolygonPoints
                  const renderPoints = computeRefinedPolygonPoints(
                    placeholder.polygonPoints!,
                    newRefinement
                  );
                  
                  onUpdate({
                    shapeRefinement: newRefinement,
                    renderPolygonPoints: renderPoints,
                  });
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0 = sharp corners, 100 = very rounded
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

