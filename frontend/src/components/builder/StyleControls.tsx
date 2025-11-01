import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlobalStyles } from '@/types/builder';
import { Palette } from 'lucide-react';

interface StyleControlsProps {
  styles: GlobalStyles;
  onUpdate: (updates: Partial<GlobalStyles>) => void;
}

const StyleControls: React.FC<StyleControlsProps> = ({ styles, onUpdate }) => {
  const updateColor = (key: keyof GlobalStyles, value: string) => {
    onUpdate({ [key]: value });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Global Styles</h3>
      </div>

      <div className="space-y-4">
        {/* Colors */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Colors</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.primaryColor}
                  onChange={(e) => updateColor('primaryColor', e.target.value)}
                  className="w-16 h-9"
                />
                <Input
                  value={styles.primaryColor}
                  onChange={(e) => updateColor('primaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.secondaryColor}
                  onChange={(e) => updateColor('secondaryColor', e.target.value)}
                  className="w-16 h-9"
                />
                <Input
                  value={styles.secondaryColor}
                  onChange={(e) => updateColor('secondaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.accentColor}
                  onChange={(e) => updateColor('accentColor', e.target.value)}
                  className="w-16 h-9"
                />
                <Input
                  value={styles.accentColor}
                  onChange={(e) => updateColor('accentColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Typography</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Heading Font</Label>
              <Select value={styles.headingFont} onValueChange={(val) => onUpdate({ headingFont: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Body Font</Label>
              <Select value={styles.bodyFont} onValueChange={(val) => onUpdate({ bodyFont: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Design Elements */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Design Elements</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Button Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['square', 'rounded', 'pill'] as const).map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={styles.buttonStyle === style ? 'default' : 'outline'}
                    onClick={() => onUpdate({ buttonStyle: style })}
                    className="capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Card Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['flat', 'outlined', 'elevated'] as const).map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={styles.cardStyle === style ? 'default' : 'outline'}
                    onClick={() => onUpdate({ cardStyle: style })}
                    className="capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Spacing</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'spacious'] as const).map((spacing) => (
                  <Button
                    key={spacing}
                    size="sm"
                    variant={styles.spacing === spacing ? 'default' : 'outline'}
                    onClick={() => onUpdate({ spacing })}
                    className="capitalize"
                  >
                    {spacing}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StyleControls;
