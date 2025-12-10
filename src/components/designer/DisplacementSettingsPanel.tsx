import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { DisplacementSettings } from '@/types/product';

interface DisplacementSettingsPanelProps {
  settings: DisplacementSettings;
  onSettingsChange: (settings: DisplacementSettings) => void;
}

export const DisplacementSettingsPanel: React.FC<DisplacementSettingsPanelProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-3 block">Displacement Settings</Label>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Displacement X</Label>
              <span className="text-[11px] text-muted-foreground">{settings.scaleX}</span>
            </div>
            <Slider
              value={[settings.scaleX]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, scaleX: Math.round(value) })
              }
              min={0}
              max={100}
              step={1}
            />
            <p className="text-[11px] text-muted-foreground">
              Horizontal displacement intensity
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Displacement Y</Label>
              <span className="text-[11px] text-muted-foreground">{settings.scaleY}</span>
            </div>
            <Slider
              value={[settings.scaleY]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, scaleY: Math.round(value) })
              }
              min={0}
              max={100}
              step={1}
            />
            <p className="text-[11px] text-muted-foreground">
              Vertical displacement intensity
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Fold Contrast Boost</Label>
              <span className="text-[11px] text-muted-foreground">
                {settings.contrastBoost.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.contrastBoost]}
              onValueChange={([value]) =>
                onSettingsChange({
                  ...settings,
                  contrastBoost: Number(value.toFixed(1)),
                })
              }
              min={1}
              max={5}
              step={0.1}
            />
            <p className="text-[11px] text-muted-foreground">
              Enhances fold visibility (1.0 = normal, 5.0 = extreme)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

