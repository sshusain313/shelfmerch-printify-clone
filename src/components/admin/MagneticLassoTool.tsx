import React, { useEffect, useRef, useState } from 'react';
import { Line, Circle } from 'react-konva';
import Konva from 'konva';

export interface Point {
  x: number;
  y: number;
}

export interface MagneticLassoToolProps {
  isActive: boolean;
  canvasWidth: number;
  canvasHeight: number;
  backgroundImage: HTMLImageElement | null;
  // Image position and size on the Stage (in stage coordinates)
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
  onComplete: (points: Point[]) => void;
  onCancel: () => void;
  magneticThreshold?: number;
  simplifyTolerance?: number;
}

const MagneticLassoTool: React.FC<MagneticLassoToolProps> = ({
  isActive,
  canvasWidth,
  canvasHeight,
  backgroundImage,
  imageX,
  imageY,
  imageWidth,
  imageHeight,
  onComplete,
  onCancel,
  magneticThreshold = 20,
  simplifyTolerance = 2,
}) => {
  // Minimum distance (in stage pixels) between recorded points while drawing.
  // Decoupled from simplifyTolerance so we don't oversample the path.
  const MIN_POINT_DISTANCE = 4;

  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [edgeData, setEdgeData] = useState<Uint8ClampedArray | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  // Process the background image to detect edges when it changes
  // Edge detection happens in IMAGE SPACE (actual rendered image dimensions)
  useEffect(() => {
    if (!backgroundImage || !isActive || imageWidth <= 0 || imageHeight <= 0) return;

    const canvas = document.createElement('canvas');
    // Use actual image dimensions, not full stage size
    canvas.width = Math.round(imageWidth);
    canvas.height = Math.round(imageHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw image at its actual rendered size (not stretched to full stage)
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    imageDataRef.current = imageData;

    const edges = detectEdges(imageData);
    setEdgeData(edges);
  }, [backgroundImage, isActive, imageWidth, imageHeight]);

  // Detect edges using Sobel operator
  const detectEdges = (imageData: ImageData): Uint8ClampedArray => {
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data.length);

    const grayscale = new Uint8ClampedArray(width * height);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        grayscale[i * width + j] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }
    }

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let pixelX = 0;
        let pixelY = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);

            pixelX += grayscale[idx] * sobelX[kernelIdx];
            pixelY += grayscale[idx] * sobelY[kernelIdx];
          }
        }

        const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);

        const outputIdx = (y * width + x) * 4;
        const edgeStrength = Math.min(255, Math.max(0, Math.round(magnitude)));

        const isEdge = edgeStrength > 50;
        output[outputIdx] = isEdge ? 255 : 0;
        output[outputIdx + 1] = isEdge ? 255 : 0;
        output[outputIdx + 2] = isEdge ? 255 : 0;
        output[outputIdx + 3] = 255;
      }
    }

    return output;
  };

  /**
   * Convert stage coordinates to image coordinates
   * @param stageX X coordinate in stage space
   * @param stageY Y coordinate in stage space
   * @returns Point in image space, or null if outside image bounds
   */
  const stageToImageCoords = (stageX: number, stageY: number): Point | null => {
    // Shift by image offset
    const relativeX = stageX - imageX;
    const relativeY = stageY - imageY;

    // Check if within image bounds
    if (relativeX < 0 || relativeX >= imageWidth || relativeY < 0 || relativeY >= imageHeight) {
      return null;
    }

    return { x: relativeX, y: relativeY };
  };

  /**
   * Convert image coordinates back to stage coordinates
   * @param imgX X coordinate in image space
   * @param imgY Y coordinate in image space
   * @returns Point in stage space
   */
  const imageToStageCoords = (imgX: number, imgY: number): Point => {
    return {
      x: imgX + imageX,
      y: imgY + imageY,
    };
  };

  /**
   * Refine a completed polygon by snapping each vertex to the strongest nearby edge
   * using the existing Sobel edge map, then returning the adjusted polygon.
   *
   * All input/output points are in STAGE SPACE (same as the lasso path).
   */
  const refinePolygonWithEdgeSnap = (
    polygonPoints: Point[],
    options?: {
      searchRadius?: number; // in pixels, image space
      maxSnapDistance?: number; // maximum allowed movement (pixels, image space)
      edgeThreshold?: number; // minimum edge intensity to consider (0–255)
    }
  ): Point[] => {
    if (!edgeData || !imageDataRef.current) return polygonPoints;

    const { width, height } = imageDataRef.current;
    const searchRadius = options?.searchRadius ?? 8; // small local neighborhood
    const maxSnapDistance = options?.maxSnapDistance ?? 10; // avoid huge jumps
    const edgeThreshold = options?.edgeThreshold ?? 1; // >0 for our binary map
    const maxSnapDistanceSq = maxSnapDistance * maxSnapDistance;

    return polygonPoints.map((stagePt) => {
      const imgPt = stageToImageCoords(stagePt.x, stagePt.y);
      if (!imgPt) {
        // Outside image bounds – keep original
        return stagePt;
      }

      const cx = imgPt.x;
      const cy = imgPt.y;

      const startX = Math.max(0, Math.floor(cx - searchRadius));
      const endX = Math.min(width - 1, Math.floor(cx + searchRadius));
      const startY = Math.max(0, Math.floor(cy - searchRadius));
      const endY = Math.min(height - 1, Math.floor(cy + searchRadius));

      let bestEdgeValue = 0;
      let bestDx = 0;
      let bestDy = 0;
      let bestDistSq = Number.POSITIVE_INFINITY;

      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const idx = (y * width + x) * 4;
          const edgeValue = edgeData[idx]; // 0 or 255 in current implementation

          if (edgeValue >= edgeThreshold) {
            const dx = x - cx;
            const dy = y - cy;
            const distSq = dx * dx + dy * dy;

            // Prefer stronger edge; on ties, prefer closer point
            if (
              edgeValue > bestEdgeValue ||
              (edgeValue === bestEdgeValue && distSq < bestDistSq)
            ) {
              bestEdgeValue = edgeValue;
              bestDx = dx;
              bestDy = dy;
              bestDistSq = distSq;
            }
          }
        }
      }

      // No suitable edge or too far – keep original vertex
      if (bestEdgeValue < edgeThreshold || bestDistSq > maxSnapDistanceSq) {
        return stagePt;
      }

      const snappedImgX = cx + bestDx;
      const snappedImgY = cy + bestDy;

      // Clamp to image bounds just in case
      const clampedImgX = Math.max(0, Math.min(width - 1, snappedImgX));
      const clampedImgY = Math.max(0, Math.min(height - 1, snappedImgY));

      // Convert back to stage space
      return imageToStageCoords(clampedImgX, clampedImgY);
    });
  };

  /**
   * Find nearest edge point in image space, then convert to stage coordinates
   * @param stageX X coordinate in stage space
   * @param stageY Y coordinate in stage space
   * @returns Nearest edge point in stage coordinates
   */
  const findNearestEdgePoint = (stageX: number, stageY: number): Point => {
    // Convert stage coordinates to image coordinates
    const imageCoords = stageToImageCoords(stageX, stageY);
    if (!imageCoords || !edgeData || !imageDataRef.current) {
      // If outside image bounds, return original stage coordinates
      return { x: stageX, y: stageY };
    }

    const { width, height } = imageDataRef.current;
    const imgX = imageCoords.x;
    const imgY = imageCoords.y;

    let minDistance = magneticThreshold * magneticThreshold;
    let nearestImagePoint = { x: imgX, y: imgY };

    const searchRadius = magneticThreshold;
    const startX = Math.max(0, Math.floor(imgX - searchRadius));
    const endX = Math.min(width - 1, Math.floor(imgX + searchRadius));
    const startY = Math.max(0, Math.floor(imgY - searchRadius));
    const endY = Math.min(height - 1, Math.floor(imgY + searchRadius));

    // Search in image space
    for (let py = startY; py <= endY; py++) {
      for (let px = startX; px <= endX; px++) {
        const idx = (py * width + px) * 4;

        if (edgeData[idx] > 0) {
          const dx = px - imgX;
          const dy = py - imgY;
          const distance = dx * dx + dy * dy;

          if (distance < minDistance) {
            minDistance = distance;
            nearestImagePoint = { x: px, y: py };
          }
        }
      }
    }

    // Convert back to stage coordinates
    return {
      x: nearestImagePoint.x + imageX,
      y: nearestImagePoint.y + imageY,
    };
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Use snapped point only for visual feedback (hover circle)
    const magneticPoint = findNearestEdgePoint(pointerPos.x, pointerPos.y);
    setHoveredPoint(magneticPoint);

    if (isDrawing) {
      // Record raw pointer positions (stage space) to avoid jitter from
      // snapping every intermediate vertex to individual edge pixels.
      const newPoint: Point = { x: pointerPos.x, y: pointerPos.y };
      const lastPoint = points[points.length - 1];
      const distance =
        lastPoint &&
        Math.hypot(newPoint.x - lastPoint.x, newPoint.y - lastPoint.y);

      if (!lastPoint || (distance ?? 0) > MIN_POINT_DISTANCE) {
        setPoints((prev) => [...prev, newPoint]);
      }
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || e.evt.button !== 0) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    stage.container().style.cursor = 'crosshair';

    setIsDrawing(true);
    // Start path from the raw pointer position; snapping is handled in post-processing.
    setPoints([{ x: pointerPos.x, y: pointerPos.y }]);
  };

  const handleMouseUp = () => {
    if (!isActive || !isDrawing) return;

    const stageContainer = document.querySelector('canvas')?.parentElement;
    if (stageContainer) {
      stageContainer.style.cursor = 'default';
    }

    if (points.length >= 3) {
      // 1) First, snap the OPEN path to nearby strong edges
      const refinedOpen = refinePolygonWithEdgeSnap(points, {
        // Use a small local neighborhood in image space
        searchRadius: 8,
        // Limit how far any vertex is allowed to move
        maxSnapDistance: 5,
        // Existing edge map is effectively binary (0 / 255), so anything >0 is an edge
        edgeThreshold: 1,
      });

      // 2) Simplify the OPEN path with Douglas–Peucker and then clean small artifacts
      const simplifiedOpen = simplifyPath(
        refinedOpen,
        simplifyTolerance * 2 // slightly stronger than live sampling
      );
      const lengthCleaned = removeShortSegments(simplifiedOpen, 4);
      const collinearMerged = mergeNearlyCollinear(lengthCleaned, 10);

      // 3) Close the polygon for output/rendering
      const finalPath =
        collinearMerged.length > 1
          ? [...collinearMerged, collinearMerged[0]]
          : collinearMerged;

      // 4) Output final path
      onComplete(finalPath);
    } else {
      onCancel();
    }

    setIsDrawing(false);
    setPoints([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        setIsDrawing(false);
        setPoints([]);
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onCancel]);

  /**
   * Path simplification using a Douglas–Peucker style algorithm.
   * Keeps the overall shape while removing jitter and redundant points.
   *
   * All points are in stage space.
   */
  const simplifyPath = (pathPoints: Point[], tolerance: number): Point[] => {
    if (pathPoints.length <= 2) return pathPoints;

    const sqTolerance = tolerance * tolerance;

    const getSqSegDist = (p: Point, p1: Point, p2: Point): number => {
      let x = p1.x;
      let y = p1.y;
      let dx = p2.x - x;
      let dy = p2.y - y;

      if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          x = p2.x;
          y = p2.y;
        } else if (t > 0) {
          x += dx * t;
          y += dy * t;
        }
      }

      dx = p.x - x;
      dy = p.y - y;

      return dx * dx + dy * dy;
    };

    const simplifyDPStep = (
      pts: Point[],
      first: number,
      last: number,
      sqTol: number,
      simplified: Point[]
    ) => {
      let maxSqDist = sqTol;
      let index = -1;

      for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (index !== -1) {
        if (index - first > 1) {
          simplifyDPStep(pts, first, index, sqTol, simplified);
        }
        simplified.push(pts[index]);
        if (last - index > 1) {
          simplifyDPStep(pts, index, last, sqTol, simplified);
        }
      }
    };

    const last = pathPoints.length - 1;
    const simplified: Point[] = [pathPoints[0]];

    simplifyDPStep(pathPoints, 0, last, sqTolerance, simplified);
    simplified.push(pathPoints[last]);

    return simplified;
  };

  /** Remove very short segments to clean small zig-zags */
  const removeShortSegments = (pts: Point[], minLen = 3): Point[] => {
    if (pts.length < 3) return pts;
    const out: Point[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = out[out.length - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (dx * dx + dy * dy >= minLen * minLen) {
        out.push(b);
      }
    }
    return out;
  };

  /** Merge nearly collinear consecutive segments to reduce jaggedness */
  const mergeNearlyCollinear = (pts: Point[], angleToleranceDeg = 8): Point[] => {
    if (pts.length < 4) return pts;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const tol = toRad(angleToleranceDeg);
    const angleBetween = (p1: Point, p2: Point, p3: Point): number => {
      const v1x = p1.x - p2.x;
      const v1y = p1.y - p2.y;
      const v2x = p3.x - p2.x;
      const v2y = p3.y - p2.y;
      const dot = v1x * v2x + v1y * v2y;
      const m1 = Math.hypot(v1x, v1y);
      const m2 = Math.hypot(v2x, v2y);
      if (m1 === 0 || m2 === 0) return 0;
      let c = dot / (m1 * m2);
      c = Math.max(-1, Math.min(1, c));
      return Math.acos(c);
    };

    const closed = pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y;
    const core = closed ? pts.slice(0, -1) : pts.slice();
    const res: Point[] = [];
    for (let i = 0; i < core.length; i++) {
      const prev = core[(i - 1 + core.length) % core.length];
      const curr = core[i];
      const next = core[(i + 1) % core.length];
      const ang = angleBetween(prev, curr, next);
      if (Math.abs(Math.PI - ang) <= tol || ang <= tol) {
        // Nearly collinear; skip current vertex
        continue;
      }
      res.push(curr);
    }
    if (closed && res.length > 0) {
      res.push({ ...res[0] });
    }
    return res.length >= 3 ? res : pts;
  };

  const flattenPoints = (pts: Point[]): number[] =>
    pts.reduce<number[]>((acc, point) => {
      acc.push(point.x, point.y);
      return acc;
    }, []);

  if (!isActive) return null;

  return (
    <>
      {points.length > 0 && (
        <Line
          points={flattenPoints(points)}
          stroke="#FF00FF"
          strokeWidth={2}
          lineCap="round"
          lineJoin="round"
          dash={[5, 5]}
        />
      )}

      {hoveredPoint && (
        <Circle
          x={hoveredPoint.x}
          y={hoveredPoint.y}
          radius={5}
          fill="rgba(255, 0, 255, 0.5)"
          stroke="#FF00FF"
          strokeWidth={1}
        />
      )}

      <Line
        points={[
          0,
          0,
          canvasWidth,
          0,
          canvasWidth,
          canvasHeight,
          0,
          canvasHeight,
          0,
          0,
        ]}
        closed
        stroke="transparent"
        fill="transparent"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        listening={isActive}
      />
    </>
  );
};

export default MagneticLassoTool;

