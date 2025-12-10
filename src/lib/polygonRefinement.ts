/**
 * Polygon Shape Refinement Utilities
 * 
 * Converts raw polygon points into smooth, curved shapes using splines
 * and geometric transformations for organic-looking placeholders.
 */

export interface Point {
  x: number;
  y: number;
}

export interface ShapeRefinement {
  smoothness: number; // 0-100
  bulgeStrength: number; // 0-100
  roundCorners: number; // 0-100
}

/**
 * Compute refined polygon points from base points using shape refinement settings
 * @param basePoints Original polygon points (in inches)
 * @param refinement Shape refinement settings
 * @returns Refined polygon points (in inches)
 */
export function computeRefinedPolygonPoints(
  basePoints: Array<{ xIn: number; yIn: number }>,
  refinement: ShapeRefinement
): Array<{ xIn: number; yIn: number }> {
  if (basePoints.length < 3) {
    return basePoints;
  }

  // Convert to Point format for processing
  const points: Point[] = basePoints.map(p => ({ x: p.xIn, y: p.yIn }));

  // Check if polygon is closed (first and last points are the same)
  const isClosed = points.length > 0 && 
    points[0].x === points[points.length - 1].x && 
    points[0].y === points[points.length - 1].y;
  
  // Remove duplicate closing point for processing
  const corePoints = isClosed ? points.slice(0, -1) : points;

  // Step 1: Round corners if requested
  let processedPoints = corePoints;
  if (refinement.roundCorners > 0) {
    processedPoints = roundCorners(corePoints, refinement.roundCorners / 100, isClosed);
  }

  // Step 2: Apply spline smoothing
  let smoothedPoints: Point[];
  if (refinement.smoothness > 0) {
    // Calculate number of samples based on smoothness (0-100 -> 1-50 samples per segment)
    const samplesPerSegment = Math.max(1, Math.floor((refinement.smoothness / 100) * 50));
    smoothedPoints = catmullRomSpline(processedPoints, samplesPerSegment, isClosed);
  } else {
    smoothedPoints = processedPoints;
  }

  // Step 3: Apply bulge effect
  let finalPoints = smoothedPoints;
  if (refinement.bulgeStrength > 0) {
    finalPoints = applyBulgeEffect(smoothedPoints, refinement.bulgeStrength / 100, isClosed);
  }

  // Ensure polygon is closed if it was originally closed
  if (isClosed && finalPoints.length > 0) {
    // Check if already closed
    const lastPoint = finalPoints[finalPoints.length - 1];
    const firstPoint = finalPoints[0];
    if (lastPoint.x !== firstPoint.x || lastPoint.y !== firstPoint.y) {
      finalPoints.push({ ...firstPoint });
    }
  }

  // Convert back to inches format
  return finalPoints.map(p => ({ xIn: p.x, yIn: p.y }));
}

/**
 * Catmull-Rom spline interpolation
 * Creates smooth curves through control points
 */
function catmullRomSpline(
  points: Point[],
  samplesPerSegment: number,
  closed: boolean = true
): Point[] {
  if (points.length < 2) return points;
  if (points.length === 2) {
    // Just interpolate between two points
    const result: Point[] = [];
    for (let i = 0; i <= samplesPerSegment; i++) {
      const t = i / samplesPerSegment;
      result.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
      });
    }
    return result;
  }

  const result: Point[] = [];
  const n = points.length;

  // For closed polygons, we need to wrap around to get proper control points
  const getPoint = (idx: number): Point => {
    if (closed) {
      return points[idx % n];
    }
    // For open paths, clamp to valid range
    if (idx < 0) return points[0];
    if (idx >= n) return points[n - 1];
    return points[idx];
  };

  const numSegments = closed ? n : n - 1;

  for (let i = 0; i < numSegments; i++) {
    const p0 = getPoint(i - 1);
    const p1 = getPoint(i);
    const p2 = getPoint(i + 1);
    const p3 = getPoint(i + 2);

    for (let j = 0; j < samplesPerSegment; j++) {
      const t = j / samplesPerSegment;
      const point = catmullRomPoint(p0, p1, p2, p3, t);
      result.push(point);
    }
  }

  // Add the last point if not closed
  if (!closed && points.length > 0) {
    result.push(points[points.length - 1]);
  }

  return result;
}

/**
 * Calculate a point on a Catmull-Rom spline
 */
function catmullRomPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom basis matrix coefficients
  const c0 = -0.5 * t3 + t2 - 0.5 * t;
  const c1 = 1.5 * t3 - 2.5 * t2 + 1;
  const c2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
  const c3 = 0.5 * t3 - 0.5 * t2;

  return {
    x: c0 * p0.x + c1 * p1.x + c2 * p2.x + c3 * p3.x,
    y: c0 * p0.y + c1 * p1.y + c2 * p2.y + c3 * p3.y,
  };
}

/**
 * Round sharp corners by blending adjacent segment directions
 */
function roundCorners(points: Point[], roundness: number, isClosed: boolean = true): Point[] {
  if (points.length < 3) return points;

  const result: Point[] = [];
  const n = points.length;

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Calculate angle at this vertex
    const angle = calculateAngle(prev, curr, next);
    const sharpness = Math.abs(Math.PI - angle); // How far from 180° (straight line)

    if (sharpness > 0.1 && roundness > 0) {
      // This is a corner - round it
      const blendFactor = Math.min(1, sharpness * roundness * 2);
      
      // Create a rounded corner by interpolating between incoming and outgoing directions
      const inDir = { x: curr.x - prev.x, y: curr.y - prev.y };
      const outDir = { x: next.x - curr.x, y: next.y - curr.y };
      const inLen = Math.hypot(inDir.x, inDir.y);
      const outLen = Math.hypot(outDir.x, outDir.y);

      if (inLen > 0 && outLen > 0) {
        // Normalize
        inDir.x /= inLen;
        inDir.y /= inLen;
        outDir.x /= outLen;
        outDir.y /= outLen;

        // Blend directions
        const blendedDir = {
          x: (inDir.x + outDir.x) * 0.5,
          y: (inDir.y + outDir.y) * 0.5,
        };
        const blendedLen = Math.hypot(blendedDir.x, blendedDir.y);
        if (blendedLen > 0) {
          blendedDir.x /= blendedLen;
          blendedDir.y /= blendedLen;
        }

        // Create rounded point slightly offset from corner
        const offset = Math.min(inLen, outLen) * 0.1 * blendFactor;
        result.push({
          x: curr.x - blendedDir.x * offset,
          y: curr.y - blendedDir.y * offset,
        });
      } else {
        result.push(curr);
      }
    } else {
      result.push(curr);
    }
  }

  return result.length >= 3 ? result : points;
}

/**
 * Calculate the angle at vertex b formed by points a-b-c
 */
function calculateAngle(a: Point, b: Point, c: Point): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);

  if (mag1 === 0 || mag2 === 0) return Math.PI;

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosAngle);
}

/**
 * Apply bulge effect to exaggerate convex regions
 * Points are offset outward along the normal direction of edges
 */
function applyBulgeEffect(points: Point[], bulgeFactor: number, isClosed: boolean = true): Point[] {
  if (points.length < 3 || bulgeFactor <= 0) return points;

  const result: Point[] = [];
  const n = points.length;

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Calculate edge vectors
    const edge1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const edge2 = { x: next.x - curr.x, y: next.y - curr.y };

    const len1 = Math.hypot(edge1.x, edge1.y);
    const len2 = Math.hypot(edge2.x, edge2.y);

    if (len1 > 0 && len2 > 0) {
      // Normalize
      edge1.x /= len1;
      edge1.y /= len1;
      edge2.x /= len2;
      edge2.y /= len2;

      // Average edge direction
      const avgDir = {
        x: (edge1.x + edge2.x) * 0.5,
        y: (edge1.y + edge2.y) * 0.5,
      };

      // Calculate outward normal (perpendicular to average direction, pointing outward)
      const normal = {
        x: -avgDir.y,
        y: avgDir.x,
      };

      // Determine if this is a convex region (bulge outward) or concave (bulge inward)
      // Use cross product to determine orientation
      const cross = edge1.x * edge2.y - edge1.y * edge2.x;
      const isConvex = cross > 0;

      // Calculate curvature estimate (how much the direction changes)
      const curvature = Math.abs(Math.atan2(
        edge2.y * edge1.x - edge2.x * edge1.y,
        edge2.x * edge1.x + edge2.y * edge1.y
      ));

      // Apply bulge offset
      const offsetMagnitude = curvature * bulgeFactor * Math.min(len1, len2) * 0.1;
      const offset = {
        x: normal.x * offsetMagnitude * (isConvex ? 1 : -0.3), // Convex bulges more
        y: normal.y * offsetMagnitude * (isConvex ? 1 : -0.3),
      };

      result.push({
        x: curr.x + offset.x,
        y: curr.y + offset.y,
      });
    } else {
      result.push(curr);
    }
  }

  return result;
}


