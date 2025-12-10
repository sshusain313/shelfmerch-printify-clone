const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize SVG content to remove potentially harmful elements
 * @param {string} svgString - Raw SVG content
 * @returns {string} Sanitized SVG content
 */
function sanitizeSVG(svgString) {
  if (!svgString || typeof svgString !== 'string') {
    throw new Error('Invalid SVG content');
  }

  // Configure DOMPurify for SVG
  const config = {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
      'text', 'tspan', 'textPath', 'defs', 'linearGradient', 'radialGradient',
      'stop', 'pattern', 'mask', 'clipPath', 'use', 'symbol', 'marker',
      'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'feColorMatrix',
      'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
      'feDisplacementMap', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
      'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feSpecularLighting',
      'feTile', 'feTurbulence', 'feDistantLight', 'fePointLight', 'feSpotLight',
      'title', 'desc', 'metadata', 'image', 'style'
    ],
    ALLOWED_ATTR: [
      'x', 'y', 'width', 'height', 'viewBox', 'preserveAspectRatio',
      'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity', 'stroke-opacity',
      'transform', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'x1', 'y1', 'x2', 'y2',
      'gradientUnits', 'gradientTransform', 'offset', 'stop-color', 'stop-opacity',
      'patternUnits', 'patternTransform', 'patternContentUnits',
      'mask', 'clip-path', 'filter', 'id', 'class', 'style', 'xmlns', 'xmlns:xlink',
      'xlink:href', 'href', 'font-family', 'font-size', 'font-weight', 'text-anchor',
      'dominant-baseline', 'alignment-baseline', 'baseline-shift', 'letter-spacing',
      'word-spacing', 'text-decoration', 'writing-mode', 'glyph-orientation-vertical',
      'glyph-orientation-horizontal', 'kerning', 'text-rendering', 'color-interpolation',
      'color-interpolation-filters', 'color-profile', 'color-rendering', 'flood-color',
      'flood-opacity', 'lighting-color', 'marker-start', 'marker-mid', 'marker-end',
      'shape-rendering', 'image-rendering', 'enable-background', 'in', 'in2', 'result',
      'stdDeviation', 'dx', 'dy', 'mode', 'type', 'values', 'radius'
    ],
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'embed', 'object'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout'],
    ALLOW_DATA_ATTR: false
  };

  // Sanitize the SVG
  const sanitized = DOMPurify.sanitize(svgString, config);

  // Additional security checks
  if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
    throw new Error('SVG contains potentially harmful content');
  }

  return sanitized;
}

/**
 * Validate SVG file size and structure
 * @param {Buffer} buffer - SVG file buffer
 * @returns {object} Validation result
 */
function validateSVG(buffer) {
  const svgString = buffer.toString('utf8');
  
  // Check if it's actually an SVG
  if (!svgString.trim().startsWith('<svg') && !svgString.includes('<svg')) {
    return {
      valid: false,
      error: 'File does not appear to be a valid SVG'
    };
  }

  // Check file size (max 5MB for SVG)
  if (buffer.length > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: 'SVG file size exceeds 5MB limit'
    };
  }

  // Check for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /<foreignObject/i,
    /on\w+\s*=/i,  // Event handlers
    /data:text\/html/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(svgString)) {
      return {
        valid: false,
        error: 'SVG contains potentially harmful content'
      };
    }
  }

  return {
    valid: true,
    sanitized: sanitizeSVG(svgString)
  };
}

/**
 * Extract SVG dimensions
 * @param {string} svgString - SVG content
 * @returns {object} Width and height
 */
function extractSVGDimensions(svgString) {
  const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/);
  const widthMatch = svgString.match(/width=["']([^"']+)["']/);
  const heightMatch = svgString.match(/height=["']([^"']+)["']/);

  let width = 0, height = 0;

  if (viewBoxMatch) {
    const [, , w, h] = viewBoxMatch[1].split(/\s+/).map(Number);
    width = w;
    height = h;
  }

  if (widthMatch && !isNaN(parseFloat(widthMatch[1]))) {
    width = parseFloat(widthMatch[1]);
  }

  if (heightMatch && !isNaN(parseFloat(heightMatch[1]))) {
    height = parseFloat(heightMatch[1]);
  }

  return { width, height };
}

module.exports = {
  sanitizeSVG,
  validateSVG,
  extractSVGDimensions
};

