import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image, Rect, Text, Line } from 'react-konva';
import Konva from 'konva';
import { Placeholder } from '@/types/product';

interface MockupPreviewProps {
  mockupImageUrl: string;
  placeholders: Placeholder[];
  canvasWidth?: number;
  canvasHeight?: number;
  physicalWidth?: number;
  physicalHeight?: number;
  unit?: 'in' | 'cm';
}

export const MockupPreview = ({
  mockupImageUrl,
  placeholders,
  canvasWidth = 800,
  canvasHeight = 600,
  physicalWidth = 20,
  physicalHeight = 24,
  unit = 'in',
}: MockupPreviewProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);
  const checkerboardPatternRef = useRef<string | null>(null);

  const canvasPadding = 40;
  const effectiveCanvasWidth = canvasWidth - (canvasPadding * 2);
  const effectiveCanvasHeight = canvasHeight - (canvasPadding * 2);

  // Calculate scale factor
  const PX_PER_INCH = (() => {
    if (!physicalWidth || !physicalHeight || physicalWidth <= 0 || physicalHeight <= 0) {
      return 10;
    }
    const scaleX = effectiveCanvasWidth / physicalWidth;
    const scaleY = effectiveCanvasHeight / physicalHeight;
    return Math.min(scaleX, scaleY);
  })();

  const inchesToPixels = (inches: number): number => {
    return inches * PX_PER_INCH;
  };

  const formatUnitLabel = (value: number): string => {
    if (unit === 'cm') {
      return `${value.toFixed(1)} cm`;
    }
    return `${value.toFixed(1)}"`;
  };

  // Load image
  useEffect(() => {
    if (!mockupImageUrl) {
      setImage(null);
      setImageSize({ width: 0, height: 0, x: 0, y: 0 });
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      const aspectRatio = img.width / img.height;
      const maxWidth = effectiveCanvasWidth;
      const maxHeight = effectiveCanvasHeight;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      const x = canvasPadding + (maxWidth - width) / 2;
      const y = canvasPadding + (maxHeight - height) / 2;
      
      setImageSize({ width, height, x, y });
    };
    img.src = mockupImageUrl;
  }, [mockupImageUrl, canvasWidth, canvasHeight, effectiveCanvasWidth, effectiveCanvasHeight, canvasPadding]);

  // Create checkerboard pattern
  useEffect(() => {
    if (!checkerboardPatternRef.current) {
      const patternSize = 20;
      const canvas = document.createElement('canvas');
      canvas.width = patternSize * 2;
      canvas.height = patternSize * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e5e5e5';
        ctx.fillRect(0, 0, patternSize, patternSize);
        ctx.fillRect(patternSize, patternSize, patternSize, patternSize);
      }
      checkerboardPatternRef.current = canvas.toDataURL();
    }
  }, []);

  if (!mockupImageUrl) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-8 min-h-[400px] flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No mockup image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-border rounded-lg overflow-hidden relative" style={{ backgroundImage: checkerboardPatternRef.current ? `url(${checkerboardPatternRef.current})` : undefined }}>
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        ref={stageRef}
        style={{ cursor: 'default' }}
      >
        <Layer>
          {/* Grid lines */}
          {(() => {
            const gridSpacing = 20;
            const gridLines = [];
            
            for (let x = canvasPadding; x < canvasWidth - canvasPadding; x += gridSpacing) {
              gridLines.push(
                <Line
                  key={`v-grid-${x}`}
                  points={[x, canvasPadding, x, canvasHeight - canvasPadding]}
                  stroke="#CCCCCC"
                  strokeWidth={0.5}
                  opacity={0.25}
                  listening={false}
                />
              );
            }
            
            for (let y = canvasPadding; y < canvasHeight - canvasPadding; y += gridSpacing) {
              gridLines.push(
                <Line
                  key={`h-grid-${y}`}
                  points={[canvasPadding, y, canvasWidth - canvasPadding, y]}
                  stroke="#CCCCCC"
                  strokeWidth={0.5}
                  opacity={0.25}
                  listening={false}
                />
              );
            }
            
            return gridLines;
          })()}

          {/* Mockup Image */}
          {image && imageSize.width > 0 && (
            <Image
              image={image}
              x={imageSize.x}
              y={imageSize.y}
              width={imageSize.width}
              height={imageSize.height}
              listening={false}
            />
          )}

          {/* Placeholder Overlays */}
          {placeholders.map((placeholder, index) => {
            const xPx = canvasPadding + inchesToPixels(placeholder.xIn);
            const yPx = canvasPadding + inchesToPixels(placeholder.yIn);
            const widthPx = inchesToPixels(placeholder.widthIn);
            const heightPx = inchesToPixels(placeholder.heightIn);
            
            const centerX = xPx + widthPx / 2;
            const centerY = yPx + heightPx / 2;
            
            return (
              <React.Fragment key={placeholder.id || index}>
                {/* Placeholder rectangle */}
                <Rect
                  x={xPx}
                  y={yPx}
                  width={widthPx}
                  height={heightPx}
                  rotation={placeholder.rotationDeg}
                  fill="rgba(244, 114, 182, 0.2)"
                  stroke="rgb(236, 72, 153)"
                  strokeWidth={2}
                  listening={false}
                />
                
                {/* Placeholder label */}
                <Text
                  x={centerX - 40}
                  y={centerY - 10}
                  text={`${index + 1}`}
                  fontSize={12}
                  fontStyle="bold"
                  fill="rgb(236, 72, 153)"
                  align="center"
                  listening={false}
                />
                
                {/* Dimensions label */}
                {/* <Text
                  x={centerX - 40}
                  y={centerY + 5}
                  text={`${formatUnitLabel(placeholder.wIn)} × ${formatUnitLabel(placeholder.hIn)}`}
                  fontSize={10}
                  fill="rgb(236, 72, 153)"
                  align="center"
                  listening={false}
                /> */}
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
      
      {/* Legend */}
      {placeholders.length > 0 && (
        <div className="flex items-center gap-2 p-3 border-t bg-card text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-pink-500 bg-pink-500/20 rounded" />
            <span>Print Areas ({placeholders.length})</span>
          </div>
        </div>
      )}
    </div>
  );
};

