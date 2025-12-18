import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image, Rect, Transformer, Line, Text, Shape } from 'react-konva';
import Konva from 'konva';
import { Placeholder } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Square, X, LassoSelect } from 'lucide-react';
import MagneticLassoTool, { Point } from './MagneticLassoTool';

interface CanvasMockupProps {
  mockupImageUrl: string | null;
  placeholders: Placeholder[];
  activePlaceholderId: string | null;
  onPlaceholderChange: (id: string, updates: Partial<Placeholder>) => void;
  onPlaceholderSelect: (id: string | null) => void;
  onPlaceholderAdd: () => void;
  onPlaceholderDelete: (id: string) => void;
  /**
   * Optional: create a real design placeholder from a completed magnetic lasso selection.
   * Receives placeholder dimensions in INCHES (same model as other placeholders), without id.
   */
  onLassoPlaceholderCreate?: (placeholder: Omit<Placeholder, 'id'>) => string | void;
  canvasWidth?: number;
  canvasHeight?: number;
  physicalWidth?: number; // Physical width in inches
  physicalHeight?: number; // Physical height in inches
  unit?: 'in' | 'cm'; // Unit for display
}

export const CanvasMockup = ({
  mockupImageUrl,
  placeholders,
  activePlaceholderId,
  onPlaceholderChange,
  onPlaceholderSelect,
  onPlaceholderAdd,
  onPlaceholderDelete,
  onLassoPlaceholderCreate,
  canvasWidth = 800,
  canvasHeight = 600,
  physicalWidth,
  physicalHeight,
  unit = 'in',
}: CanvasMockupProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Rect | Konva.Shape>>({});
  const checkerboardPatternRef = useRef<string | null>(null);
  const [isMagneticLassoActive, setIsMagneticLassoActive] = useState(false);
  const [completedLassoPaths, setCompletedLassoPaths] = useState<{ id: string; points: Point[] }[]>([]);

  // Canvas padding
  const canvasPadding = 40;
  const effectiveCanvasWidth = canvasWidth - (canvasPadding * 2); // Account for padding
  const effectiveCanvasHeight = canvasHeight - (canvasPadding * 2); // Account for padding

  // Calculate single scale factor for physical dimensions
  // Use the smaller scale to ensure content fits, maintaining aspect ratio
  // This ensures 1"×1" is a perfect square in pixels
  const PX_PER_INCH = (() => {
    if (!physicalWidth || !physicalHeight || physicalWidth <= 0 || physicalHeight <= 0) {
      return 10; // Fallback: 10px per inch
    }
    const scaleX = effectiveCanvasWidth / physicalWidth;
    const scaleY = effectiveCanvasHeight / physicalHeight;
    // Use the smaller scale to ensure everything fits
    return Math.min(scaleX, scaleY);
  })();

  // Helper function to convert pixels to physical units (inches)
  const pixelsToUnits = (pixels: number): number => {
    return pixels / PX_PER_INCH;
  };

  // Helper function to convert inches to pixels
  const inchesToPixels = (inches: number): number => {
    return inches * PX_PER_INCH;
  };

  // Helper function to format unit label
  const formatUnitLabel = (value: number): string => {
    if (unit === 'cm') {
      return `${value.toFixed(1)} cm`;
    }
    return `${value.toFixed(1)}"`;
  };

  // Load image when URL changes
  useEffect(() => {
    if (!mockupImageUrl) {
      setImage(null);
      setImageSize({ width: 0, height: 0, x: 0, y: 0 });
      return;
    }

    console.log('CanvasMockup loading image:', mockupImageUrl);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('CanvasMockup image loaded:', img.width, img.height);
      setImage(img);
      // Calculate size to fit canvas while maintaining aspect ratio with padding
      const aspectRatio = img.width / img.height;
      const maxWidth = effectiveCanvasWidth;
      const maxHeight = effectiveCanvasHeight;

      let width = maxWidth;
      let height = maxWidth / aspectRatio;

      // If height exceeds, fit to height instead
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }

      // Center the image
      const x = canvasPadding + (maxWidth - width) / 2;
      const y = canvasPadding + (maxHeight - height) / 2;

      setImageSize({ width, height, x, y });
    };
    img.onerror = (e) => {
      console.error('CanvasMockup image failed to load:', e, mockupImageUrl);
      // Fallback: try without crossOrigin
      console.log('Retrying without crossOrigin...');
      const retryImg = new window.Image();
      retryImg.onload = () => {
        console.log('CanvasMockup image loaded without crossOrigin (Lasso may fail)');
        setImage(retryImg);
        // ... same sizing logic ...
        const aspectRatio = retryImg.width / retryImg.height;
        const maxWidth = effectiveCanvasWidth;
        const maxHeight = effectiveCanvasHeight;
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        if (height > maxHeight) { height = maxHeight; width = maxHeight * aspectRatio; }
        const x = canvasPadding + (maxWidth - width) / 2;
        const y = canvasPadding + (maxHeight - height) / 2;
        setImageSize({ width, height, x, y });
      };
      retryImg.src = mockupImageUrl;
    };
    img.src = mockupImageUrl;
  }, [mockupImageUrl, canvasWidth, canvasHeight, effectiveCanvasWidth, effectiveCanvasHeight, canvasPadding]);

  // Update transformer when active placeholder changes
  useEffect(() => {
    if (activePlaceholderId && transformerRef.current && shapeRefs.current[activePlaceholderId]) {
      transformerRef.current.nodes([shapeRefs.current[activePlaceholderId]]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [activePlaceholderId]);

  // Keep completed lasso overlays in sync with existing placeholders
  useEffect(() => {
    setCompletedLassoPaths((prev) => prev.filter((p) => placeholders.some((ph) => ph.id === p.id)));
  }, [placeholders]);

  const handlePlaceholderDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Rect;
    // Convert pixel position back to inches
    const xIn = pixelsToUnits(node.x() - canvasPadding); // Account for padding
    const yIn = pixelsToUnits(node.y() - canvasPadding); // Account for padding

    onPlaceholderChange(id, {
      xIn,
      yIn,
    });
  };

  const handlePlaceholderTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Rect;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Find the placeholder to check lockSize
    const placeholder = placeholders.find(p => p.id === id);
    if (!placeholder) return;

    const lockSize = placeholder.lockSize ?? false;
    const currentScale = placeholder.scale ?? 1.0;

    // Reset node scale
    node.scaleX(1);
    node.scaleY(1);

    const rotation = node.rotation();
    const xIn = pixelsToUnits(node.x() - canvasPadding);
    const yIn = pixelsToUnits(node.y() - canvasPadding);

    if (lockSize) {
      // Lock mode: Update scale only, keep widthIn/heightIn unchanged
      // Calculate new scale based on transform
      const newScaleX = currentScale * scaleX;
      const newScaleY = currentScale * scaleY;
      // Use average of both scales to maintain aspect ratio
      const newScale = (newScaleX + newScaleY) / 2;

      onPlaceholderChange(id, {
        xIn,
        yIn,
        scale: Math.max(0.1, newScale), // Minimum scale of 0.1
        rotationDeg: rotation,
      });
    } else {
      // Unlocked mode: Update widthIn/heightIn and reset scale to 1
      const newWidthPx = Math.max(5, node.width() * scaleX);
      const newHeightPx = Math.max(5, node.height() * scaleY);
      const widthIn = pixelsToUnits(newWidthPx);
      const heightIn = pixelsToUnits(newHeightPx);

      onPlaceholderChange(id, {
        xIn,
        yIn,
        widthIn,
        heightIn,
        scale: 1.0, // Reset scale when changing real dimensions
        rotationDeg: rotation,
      });
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect if clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty && !isMagneticLassoActive) {
      onPlaceholderSelect(null);
    }
  };

  // Create checkerboard pattern once and cache it
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
      <div className="border-2 border-dashed border-border rounded-lg p-8 min-h-[500px] flex items-center justify-center" style={{ backgroundImage: checkerboardPatternRef.current ? `url(${checkerboardPatternRef.current})` : undefined }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Upload a mockup image to start</p>
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
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ cursor: isMagneticLassoActive ? 'crosshair' : 'default' }}
      >
        <Layer>
          {/* Subtle grid lines - 20px increments, thin and faint */}
          {(() => {
            const gridSpacing = 20;
            const gridLines = [];

            // Vertical grid lines
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

            // Horizontal grid lines
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

          {/* Mockup Image Background - Centered with padding */}
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

          {/* Placeholder Shapes - Convert from inches to pixels for display */}
          {placeholders.map((placeholder) => {
            const isActive = activePlaceholderId === placeholder.id;
            const scale = placeholder.scale ?? 1.0;
            const isPolygon = placeholder.shapeType === 'polygon' && placeholder.polygonPoints && placeholder.polygonPoints.length >= 3;

            // Convert inches to pixels for display, then apply scale
            const xPx = canvasPadding + inchesToPixels(placeholder.xIn);
            const yPx = canvasPadding + inchesToPixels(placeholder.yIn);
            const widthPx = inchesToPixels(placeholder.widthIn) * scale;
            const heightPx = inchesToPixels(placeholder.heightIn) * scale;

            // For polygons, use renderPolygonPoints if available, otherwise fall back to polygonPoints
            const pointsToUse = isPolygon
              ? (placeholder.renderPolygonPoints && placeholder.renderPolygonPoints.length >= 3
                ? placeholder.renderPolygonPoints
                : placeholder.polygonPoints!)
              : [];

            // Convert polygon points from inches to pixels
            const polygonPointsPx = isPolygon
              ? pointsToUse.map((pt) => [
                canvasPadding + inchesToPixels(pt.xIn) * scale,
                canvasPadding + inchesToPixels(pt.yIn) * scale,
              ]).flat()
              : [];

            return (
              <React.Fragment key={placeholder.id}>
                {isPolygon ? (
                  // Render polygon placeholder
                  <Shape
                    ref={(node) => {
                      if (node) {
                        shapeRefs.current[placeholder.id] = node;
                      }
                    }}
                    sceneFunc={(context, shape) => {
                      context.beginPath();
                      if (polygonPointsPx.length >= 6) {
                        context.moveTo(polygonPointsPx[0], polygonPointsPx[1]);
                        for (let i = 2; i < polygonPointsPx.length; i += 2) {
                          context.lineTo(polygonPointsPx[i], polygonPointsPx[i + 1]);
                        }
                        context.closePath();
                      }
                      context.fillStrokeShape(shape);
                    }}
                    fill={isActive ? 'rgba(244, 114, 182, 0.3)' : 'rgba(244, 114, 182, 0.15)'}
                    stroke={isActive ? 'rgb(236, 72, 153)' : 'rgba(244, 114, 182, 0.5)'}
                    strokeWidth={isActive ? 3 : 2}
                    draggable
                    onClick={() => onPlaceholderSelect(placeholder.id)}
                    onTap={() => onPlaceholderSelect(placeholder.id)}
                    onDragEnd={(e) => handlePlaceholderDragEnd(placeholder.id, e)}
                    onTransformEnd={(e) => handlePlaceholderTransformEnd(placeholder.id, e)}
                  />
                ) : (
                  // Render rectangular placeholder
                  <Rect
                    ref={(node) => {
                      if (node) {
                        shapeRefs.current[placeholder.id] = node;
                      }
                    }}
                    x={xPx}
                    y={yPx}
                    width={widthPx}
                    height={heightPx}
                    rotation={placeholder.rotationDeg}
                    fill={isActive ? 'rgba(244, 114, 182, 0.3)' : 'rgba(244, 114, 182, 0.15)'}
                    stroke={isActive ? 'rgb(236, 72, 153)' : 'rgba(244, 114, 182, 0.5)'}
                    strokeWidth={isActive ? 3 : 2}
                    draggable
                    onClick={() => onPlaceholderSelect(placeholder.id)}
                    onTap={() => onPlaceholderSelect(placeholder.id)}
                    onDragEnd={(e) => handlePlaceholderDragEnd(placeholder.id, e)}
                    onTransformEnd={(e) => handlePlaceholderTransformEnd(placeholder.id, e)}
                  />
                )}

                {/* Bounding Box for Active Placeholder - matches placeholder exactly */}
                {isActive && !isPolygon && (
                  <>
                    {/* Bounding box outline - matches placeholder dimensions */}
                    <Rect
                      x={xPx - 2}
                      y={yPx - 2}
                      width={widthPx + 4}
                      height={heightPx + 4}
                      rotation={placeholder.rotationDeg}
                      stroke="rgba(59, 130, 246, 0.8)"
                      strokeWidth={2}
                      dash={[4, 4]}
                      listening={false}
                    />

                    {/* Corner indicators on placeholder corners */}
                    {(() => {
                      const centerX = xPx + widthPx / 2;
                      const centerY = yPx + heightPx / 2;
                      const angle = (placeholder.rotationDeg * Math.PI) / 180;
                      const corners = [
                        { x: xPx, y: yPx },
                        { x: xPx + widthPx, y: yPx },
                        { x: xPx + widthPx, y: yPx + heightPx },
                        { x: xPx, y: yPx + heightPx },
                      ];

                      return corners.map((corner, idx) => {
                        const dx = corner.x - centerX;
                        const dy = corner.y - centerY;
                        const rotatedX = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
                        const rotatedY = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);

                        return (
                          <Rect
                            key={`corner-${idx}`}
                            x={rotatedX - 4}
                            y={rotatedY - 4}
                            width={8}
                            height={8}
                            fill="rgba(59, 130, 246, 1)"
                            stroke="white"
                            strokeWidth={1.5}
                            listening={false}
                          />
                        );
                      });
                    })()}
                  </>
                )}

                {/* Active indicator for polygon placeholders */}
                {isActive && isPolygon && (
                  <Line
                    points={polygonPointsPx}
                    closed
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth={2}
                    dash={[4, 4]}
                    listening={false}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Completed Lasso Paths - Render persistently */}
          {completedLassoPaths.map((entry, index) => {
            const flattenedPoints = entry.points.reduce<number[]>((acc, point) => {
              acc.push(point.x, point.y);
              return acc;
            }, []);
            return (
              <Line
                key={`lasso-path-${index}`}
                points={flattenedPoints}
                stroke="#FF00FF"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
                closed
                listening={false}
              />
            );
          })}

          {/* Magnetic Lasso Tool overlay */}
          {image && imageSize.width > 0 && imageSize.height > 0 && (
            <MagneticLassoTool
              isActive={isMagneticLassoActive}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              backgroundImage={image}
              imageX={imageSize.x}
              imageY={imageSize.y}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
              onComplete={(points: Point[]) => {
                console.log('Magnetic lasso completed with points:', points);
                // Persist a visual overlay path tied to the created placeholder id

                // Convert lasso polygon into a polygon design placeholder (inches) for persistence
                if (onLassoPlaceholderCreate && points.length >= 3) {
                  // Convert each polygon point from canvas pixels to INCHES, accounting for padding
                  const polygonPointsIn = points.map((point) => ({
                    xIn: pixelsToUnits(point.x - canvasPadding),
                    yIn: pixelsToUnits(point.y - canvasPadding),
                  }));

                  // Calculate bounding box for xIn, yIn, widthIn, heightIn (for compatibility)
                  const xs = points.map(p => p.x);
                  const ys = points.map(p => p.y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);

                  const xIn = pixelsToUnits(minX - canvasPadding);
                  const yIn = pixelsToUnits(minY - canvasPadding);
                  const widthIn = pixelsToUnits(maxX - minX);
                  const heightIn = pixelsToUnits(maxY - minY);

                  const newId = onLassoPlaceholderCreate({
                    xIn,
                    yIn,
                    widthIn,
                    heightIn,
                    rotationDeg: 0,
                    scale: 1.0,
                    lockSize: false,
                    shapeType: 'polygon',
                    polygonPoints: polygonPointsIn,
                  });

                  if (typeof newId === 'string' && newId.length > 0) {
                    setCompletedLassoPaths((prev) => [...prev, { id: newId, points }]);
                  }
                }

                setIsMagneticLassoActive(false);
              }}
              onCancel={() => {
                setIsMagneticLassoActive(false);
              }}
            />
          )}

          {/* Guide Lines for Active Placeholder with Markers */}
          {activePlaceholderId && (() => {
            const activePlaceholder = placeholders.find(p => p.id === activePlaceholderId);
            if (!activePlaceholder) return null;

            const scale = activePlaceholder.scale ?? 1.0;
            // Convert to pixels for display, then apply scale
            const xPx = canvasPadding + inchesToPixels(activePlaceholder.xIn);
            const yPx = canvasPadding + inchesToPixels(activePlaceholder.yIn);
            const widthPx = inchesToPixels(activePlaceholder.widthIn) * scale;
            const heightPx = inchesToPixels(activePlaceholder.heightIn) * scale;

            const centerX = xPx + widthPx / 2;
            const centerY = yPx + heightPx / 2;
            const leftX = xPx;
            const rightX = xPx + widthPx;
            const topY = yPx;
            const bottomY = yPx + heightPx;

            return (
              <>
                {/* Horizontal Guide Line from center */}
                <Line
                  points={[0, centerY, canvasWidth, centerY]}
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth={1}
                  dash={[5, 5]}
                  listening={false}
                />
                {/* Vertical Guide Line from center */}
                <Line
                  points={[centerX, 0, centerX, canvasHeight]}
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth={1}
                  dash={[5, 5]}
                  listening={false}
                />

                {/* Horizontal Guide Line from left edge */}
                <Line
                  points={[0, topY, canvasWidth, topY]}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={1}
                  dash={[3, 3]}
                  listening={false}
                />
                {/* Horizontal Guide Line from right edge */}
                <Line
                  points={[0, bottomY, canvasWidth, bottomY]}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={1}
                  dash={[3, 3]}
                  listening={false}
                />
                {/* Vertical Guide Line from left edge */}
                <Line
                  points={[leftX, 0, leftX, canvasHeight]}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={1}
                  dash={[3, 3]}
                  listening={false}
                />
                {/* Vertical Guide Line from right edge */}
                <Line
                  points={[rightX, 0, rightX, canvasHeight]}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={1}
                  dash={[3, 3]}
                  listening={false}
                />

                {/* Blue square markers at guide line ends */}
                {/* Left marker on horizontal center line */}
                <Rect
                  x={0}
                  y={centerY - 4}
                  width={8}
                  height={8}
                  fill="rgba(59, 130, 246, 0.8)"
                  stroke="rgba(59, 130, 246, 1)"
                  strokeWidth={1}
                  listening={false}
                />
                {/* Right marker on horizontal center line */}
                <Rect
                  x={canvasWidth - 8}
                  y={centerY - 4}
                  width={8}
                  height={8}
                  fill="rgba(59, 130, 246, 0.8)"
                  stroke="rgba(59, 130, 246, 1)"
                  strokeWidth={1}
                  listening={false}
                />
                {/* Top marker on vertical center line */}
                <Rect
                  x={centerX - 4}
                  y={0}
                  width={8}
                  height={8}
                  fill="rgba(59, 130, 246, 0.8)"
                  stroke="rgba(59, 130, 246, 1)"
                  strokeWidth={1}
                  listening={false}
                />
                {/* Bottom marker on vertical center line */}
                <Rect
                  x={centerX - 4}
                  y={canvasHeight - 8}
                  width={8}
                  height={8}
                  fill="rgba(59, 130, 246, 0.8)"
                  stroke="rgba(59, 130, 246, 1)"
                  strokeWidth={1}
                  listening={false}
                />

                {/* Labels along guide lines - Show TRUE print dimensions in inches, not scaled */}
                {/* X coordinate label on horizontal line (left side) */}
                <Text
                  x={leftX - 35}
                  y={centerY - 7}
                  text={`X: ${formatUnitLabel(activePlaceholder.xIn)}`}
                  fontSize={11}
                  fontStyle="bold"
                  fill="rgba(59, 130, 246, 0.9)"
                  align="right"
                  listening={false}
                />
                {/* Y coordinate label on vertical line (top) */}
                <Text
                  x={centerX + 5}
                  y={topY - 20}
                  text={`Y: ${formatUnitLabel(activePlaceholder.yIn)}`}
                  fontSize={11}
                  fontStyle="bold"
                  fill="rgba(59, 130, 246, 0.9)"
                  listening={false}
                />
                {/* Width label - shows REAL print width (widthIn), not scaled */}
                <Text
                  x={centerX - 20}
                  y={bottomY + 15}
                  text={`W: ${formatUnitLabel(activePlaceholder.widthIn)}`}
                  fontSize={11}
                  fontStyle="bold"
                  fill="rgba(59, 130, 246, 0.9)"
                  listening={false}
                />
                {/* Height label - shows REAL print height (heightIn), not scaled */}
                <Text
                  x={leftX - 35}
                  y={centerY + 5}
                  text={`H: ${formatUnitLabel(activePlaceholder.heightIn)}`}
                  fontSize={11}
                  fontStyle="bold"
                  fill="rgba(59, 130, 246, 0.9)"
                  align="right"
                  listening={false}
                />
              </>
            );
          })()}

          {/* Transformer for Active Placeholder */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'top-center',
              'bottom-center',
              'middle-left',
              'middle-right',
            ]}
          />
        </Layer>
      </Stage>

      {/* Toolbar - Buttons outside canvas */}
      <div className="flex items-center justify-between p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onPlaceholderAdd}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Add Placeholder
          </Button>
          <Button
            variant={isMagneticLassoActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsMagneticLassoActive((prev) => !prev)}
            className="gap-2"
          >
            <LassoSelect className="h-4 w-4" />
            {isMagneticLassoActive ? 'Exit Magnetic Lasso' : 'Magnetic Lasso'}
          </Button>
          {activePlaceholderId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onPlaceholderDelete(activePlaceholderId)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Delete Placeholder
            </Button>
          )}
        </div>
        {activePlaceholderId && (
          <div className="text-sm text-muted-foreground">
            {placeholders.find(p => p.id === activePlaceholderId) && (
              <span>
                Placeholder selected
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

