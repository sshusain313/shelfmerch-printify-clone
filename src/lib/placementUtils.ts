/**
 * Utility functions for converting between pixel coordinates and normalized placement.
 * 
 * COORDINATE SYSTEMS:
 * 1. Editor Pixels: Canvas coordinates in DesignEditor (800x600 canvas with 40px padding)
 * 2. Normalized (0-1): Position/size relative to print area bounds
 * 3. Mockup Pixels: Raw image pixels in mockup images
 * 4. Pixi Stage Pixels: PixiJS canvas coordinates (matches editor: 800x600)
 */

import type { DesignPlacement, Placeholder, ViewKey } from '@/types/product';

/** Print area bounds in pixel coordinates */
export interface PrintAreaPixels {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Design bounds in pixel coordinates */
export interface DesignBoundsPixels {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/** Canvas geometry constants (must match DesignEditor) */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const CANVAS_PADDING = 40;
export const EFFECTIVE_WIDTH = CANVAS_WIDTH - CANVAS_PADDING * 2; // 720
export const EFFECTIVE_HEIGHT = CANVAS_HEIGHT - CANVAS_PADDING * 2; // 520

/**
 * Calculate PX_PER_INCH for a given physical dimension (matching DesignEditor)
 */
export function calculatePxPerInch(physicalWidth: number, physicalHeight: number): number {
  return Math.min(EFFECTIVE_WIDTH / physicalWidth, EFFECTIVE_HEIGHT / physicalHeight);
}

/**
 * Convert a placeholder (stored in inches) to pixel bounds on the editor canvas.
 * This matches the coordinate system used in DesignEditor and CanvasMockup.
 */
export function placeholderToPixels(
  placeholder: Placeholder,
  physicalWidth: number,
  physicalHeight: number
): PrintAreaPixels {
  const pxPerInch = calculatePxPerInch(physicalWidth, physicalHeight);
  
  return {
    x: CANVAS_PADDING + placeholder.xIn * pxPerInch,
    y: CANVAS_PADDING + placeholder.yIn * pxPerInch,
    w: placeholder.widthIn * pxPerInch,
    h: placeholder.heightIn * pxPerInch,
  };
}

/**
 * Convert pixel coordinates to normalized (0-1) placement relative to print area.
 * 
 * @param designBounds - Design bounds in pixel coordinates (top-left x,y and size)
 * @param printArea - Print area bounds in pixel coordinates
 * @param view - View key (front, back, etc.)
 * @param placeholderId - Placeholder ID
 * @returns Normalized placement
 */
export function pixelsToNormalized(
  designBounds: DesignBoundsPixels,
  printArea: PrintAreaPixels,
  view: ViewKey,
  placeholderId: string
): DesignPlacement {
  // Guard against division by zero
  const safeW = printArea.w > 0 ? printArea.w : 1;
  const safeH = printArea.h > 0 ? printArea.h : 1;
  
  // Calculate normalized position (top-left of design relative to print area)
  const normalizedX = (designBounds.x - printArea.x) / safeW;
  const normalizedY = (designBounds.y - printArea.y) / safeH;
  
  // Calculate normalized size
  const normalizedW = designBounds.width / safeW;
  const normalizedH = designBounds.height / safeH;
  
  // Calculate aspect ratio for reference
  const aspectRatio = designBounds.width > 0 && designBounds.height > 0 
    ? designBounds.width / designBounds.height 
    : 1;
  
  return {
    view,
    placeholderId,
    x: normalizedX,
    y: normalizedY,
    w: normalizedW,
    h: normalizedH,
    rotationDeg: designBounds.rotation || 0,
    aspectRatio,
  };
}

/**
 * Convert normalized (0-1) placement to pixel coordinates for a given print area.
 * Used when rendering in MockupsLibrary/RealisticWebGLPreview.
 * 
 * @param placement - Normalized placement (0-1 range)
 * @param printArea - Target print area in pixels
 * @returns Pixel bounds for the design
 */
export function normalizedToPixels(
  placement: DesignPlacement,
  printArea: PrintAreaPixels
): DesignBoundsPixels {
  return {
    x: printArea.x + placement.x * printArea.w,
    y: printArea.y + placement.y * printArea.h,
    width: placement.w * printArea.w,
    height: placement.h * printArea.h,
    rotation: placement.rotationDeg || 0,
  };
}

/**
 * Convert placement to Pixi.js coordinates.
 * Uses center-based positioning for correct rotation behavior.
 * 
 * @param placement - Normalized placement
 * @param printArea - Print area in Pixi stage pixels
 * @returns Object with position (center), size, and rotation for Pixi sprite
 */
export function placementToPixi(
  placement: DesignPlacement,
  printArea: PrintAreaPixels
): {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
} {
  const px = normalizedToPixels(placement, printArea);
  
  return {
    centerX: px.x + px.width / 2,
    centerY: px.y + px.height / 2,
    width: px.width,
    height: px.height,
    rotation: ((px.rotation || 0) * Math.PI) / 180,
  };
}

/**
 * Convert placeholder from inches to mockup image pixels.
 * Used when rendering designs onto raw mockup images.
 * 
 * This replicates the coordinate system used in CanvasMockup.tsx:
 * - 800x600 canvas with 40px padding
 * - Mockup image scaled to fit and centered within effective area
 * - Placeholders positioned using PX_PER_INCH from physical dimensions
 */
export function placeholderToMockupPixels(
  placeholder: Placeholder,
  mockupImgWidth: number,
  mockupImgHeight: number,
  physicalDimensions: { width: number; height: number }
): PrintAreaPixels {
  const physW = physicalDimensions.width;
  const physH = physicalDimensions.height;
  
  // PX_PER_INCH used in CanvasMockup
  const pxPerInchCanvas = Math.min(EFFECTIVE_WIDTH / physW, EFFECTIVE_HEIGHT / physH);
  
  // How the mockup image is sized and centered in canvas
  const aspectRatio = mockupImgWidth / mockupImgHeight;
  let imgCanvasW = EFFECTIVE_WIDTH;
  let imgCanvasH = imgCanvasW / aspectRatio;
  if (imgCanvasH > EFFECTIVE_HEIGHT) {
    imgCanvasH = EFFECTIVE_HEIGHT;
    imgCanvasW = EFFECTIVE_HEIGHT * aspectRatio;
  }
  
  // Mockup image position in stage coordinates
  const imgStageX = CANVAS_PADDING + (EFFECTIVE_WIDTH - imgCanvasW) / 2;
  const imgStageY = CANVAS_PADDING + (EFFECTIVE_HEIGHT - imgCanvasH) / 2;
  
  // Scale factor: from canvas pixels to raw image pixels
  const scaleToRaw = mockupImgWidth / imgCanvasW;
  
  // Convert inches to stage coordinates
  const xStage = CANVAS_PADDING + placeholder.xIn * pxPerInchCanvas;
  const yStage = CANVAS_PADDING + placeholder.yIn * pxPerInchCanvas;
  const wStage = placeholder.widthIn * pxPerInchCanvas;
  const hStage = placeholder.heightIn * pxPerInchCanvas;
  
  // Get position relative to mockup image top-left in stage coords
  const xRelStage = xStage - imgStageX;
  const yRelStage = yStage - imgStageY;
  
  // Scale to raw image pixels
  return {
    x: xRelStage * scaleToRaw,
    y: yRelStage * scaleToRaw,
    w: wStage * scaleToRaw,
    h: hStage * scaleToRaw,
  };
}

/**
 * Apply normalized placement to mockup pixel coordinates.
 * Combines placeholder-to-mockup conversion with placement application.
 */
export function placementToMockupPixels(
  placement: DesignPlacement,
  placeholder: Placeholder,
  mockupImgWidth: number,
  mockupImgHeight: number,
  physicalDimensions: { width: number; height: number }
): DesignBoundsPixels {
  // First get the print area in mockup pixels
  const printArea = placeholderToMockupPixels(
    placeholder,
    mockupImgWidth,
    mockupImgHeight,
    physicalDimensions
  );
  
  // Then apply the normalized placement
  return normalizedToPixels(placement, printArea);
}

/**
 * Create a default centered placement for a design within a placeholder.
 * Uses "contain" fit - scales to fit while preserving aspect ratio.
 * 
 * @param designAspectRatio - Aspect ratio of the design image (width/height)
 * @param printAreaAspectRatio - Aspect ratio of the print area (width/height)
 * @param view - View key
 * @param placeholderId - Placeholder ID
 * @returns Centered, fitted placement
 */
export function createDefaultPlacement(
  designAspectRatio: number,
  printAreaAspectRatio: number,
  view: ViewKey,
  placeholderId: string
): DesignPlacement {
  let w: number;
  let h: number;
  
  if (designAspectRatio > printAreaAspectRatio) {
    // Design is wider than print area - fit to width
    w = 1;
    h = printAreaAspectRatio / designAspectRatio;
  } else {
    // Design is taller than print area - fit to height
    h = 1;
    w = designAspectRatio / printAreaAspectRatio;
  }
  
  // Center the design within the print area
  const x = (1 - w) / 2;
  const y = (1 - h) / 2;
  
  return {
    view,
    placeholderId,
    x,
    y,
    w,
    h,
    rotationDeg: 0,
    aspectRatio: designAspectRatio,
  };
}

/**
 * Clamp a placement to ensure the design stays within print area bounds.
 * Useful after drag/resize operations.
 */
export function clampPlacement(placement: DesignPlacement): DesignPlacement {
  // Ensure design doesn't go outside print area (0-1 bounds)
  const clampedX = Math.max(0, Math.min(1 - placement.w, placement.x));
  const clampedY = Math.max(0, Math.min(1 - placement.h, placement.y));
  
  // Ensure size doesn't exceed print area
  const clampedW = Math.min(1, Math.max(0.01, placement.w)); // Min 1% size
  const clampedH = Math.min(1, Math.max(0.01, placement.h));
  
  return {
    ...placement,
    x: clampedX,
    y: clampedY,
    w: clampedW,
    h: clampedH,
  };
}

/**
 * Check if two placements are effectively equal (within tolerance).
 */
export function placementsEqual(a: DesignPlacement, b: DesignPlacement, tolerance = 0.001): boolean {
  return (
    a.view === b.view &&
    a.placeholderId === b.placeholderId &&
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance &&
    Math.abs(a.w - b.w) < tolerance &&
    Math.abs(a.h - b.h) < tolerance &&
    Math.abs((a.rotationDeg || 0) - (b.rotationDeg || 0)) < 0.1
  );
}
