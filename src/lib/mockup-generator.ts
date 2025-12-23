import { Application, Assets, Sprite, DisplacementFilter, Container } from 'pixi.js';

interface MockupOptimizationSettings {
    width: number;
    height: number;
    quality?: number; // 0.1 to 1.0 (default 0.8)
}

interface GenerateMockupParams {
    mockupImageUrl: string;
    designImageUrl: string; // Pre-composited design image (transparent PNG)
    displacementSettings?: {
        scaleX: number;
        scaleY: number;
        contrastBoost: number; // Used for map generation logic if needed, or we assume map exists
    };
    garmentTintHex?: string | null;
    // Dimensions of the placeholder area on the mockup (in pixels relative to mockup image)
    placeholderConfig?: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
    };
    outputSettings?: MockupOptimizationSettings;
}

// Helper: Create displacement map texture (simplified version of realistic preview logic)
// In a real implementation, we might reuse `createDisplacementTextureFromGarment` from lib/displacementMap
import { createDisplacementTextureFromGarment } from './displacementMap';

export const generateMockupImage = async ({
    mockupImageUrl,
    designImageUrl,
    displacementSettings = { scaleX: 20, scaleY: 20, contrastBoost: 1.5 },
    garmentTintHex = null,
    placeholderConfig, // If null, assume design covers the whole mockup (less likely for realistic)
    outputSettings = { width: 1000, height: 1000, quality: 0.8 },
}: GenerateMockupParams): Promise<string> => {
    // 1. Initialize off-screen Pixi App
    const app = new Application();
    await app.init({
        width: outputSettings.width,
        height: outputSettings.height,
        backgroundAlpha: 0,
        preference: 'webgl',
        // headless can be simulated by not appending view to DOM
    });

    try {
        // 2. Load Assets
        const [garmentTex, designTex] = await Promise.all([
            Assets.load(mockupImageUrl),
            Assets.load(designImageUrl),
        ]);

        // 3. Setup Scene
        // Garment
        const garmentSprite = new Sprite(garmentTex);

        // Scale garment to fit output canvas (contain)
        const scale = Math.min(
            outputSettings.width / garmentTex.width,
            outputSettings.height / garmentTex.height
        );
        garmentSprite.scale.set(scale);
        garmentSprite.x = (outputSettings.width - garmentTex.width * scale) / 2;
        garmentSprite.y = (outputSettings.height - garmentTex.height * scale) / 2;

        if (garmentTintHex) {
            garmentSprite.tint = parseInt(garmentTintHex.replace('#', ''), 16);
        }

        app.stage.addChild(garmentSprite);

        // Design
        const designSprite = new Sprite(designTex);

        // Position Design
        // If placeholderConfig provided (relative to original image dimensions), map to scaled sprite
        if (placeholderConfig) {
            designSprite.x = garmentSprite.x + (placeholderConfig.x * scale);
            designSprite.y = garmentSprite.y + (placeholderConfig.y * scale);
            designSprite.width = placeholderConfig.width * scale;
            designSprite.height = placeholderConfig.height * scale;
            if (placeholderConfig.rotation) {
                designSprite.rotation = placeholderConfig.rotation * (Math.PI / 180);
                // Adjust anchor for rotation if needed, usually center
            }
        } else {
            // Fallback: Centered 50% width
            const designScale = (garmentTex.width * 0.5) / designTex.width;
            designSprite.scale.set(designScale * scale);
            designSprite.anchor.set(0.5);
            designSprite.x = outputSettings.width / 2;
            designSprite.y = outputSettings.height / 2;
        }

        // Displacement
        if (displacementSettings) {
            try {
                // We reuse the garment URL for displacement map
                // Note: Using the helper from the codebase if possible
                const dispTexture = await createDisplacementTextureFromGarment(
                    mockupImageUrl,
                    displacementSettings.contrastBoost
                );

                const dispSprite = new Sprite(dispTexture);
                dispSprite.position.copyFrom(garmentSprite.position);
                dispSprite.scale.copyFrom(garmentSprite.scale);
                dispSprite.visible = false; // Hidden, used for filter
                app.stage.addChild(dispSprite);

                const filter = new DisplacementFilter({
                    sprite: dispSprite,
                    scale: {
                        x: displacementSettings.scaleX * scale, // Scale filter strength by visual scale?
                        y: displacementSettings.scaleY * scale
                    }
                });

                designSprite.filters = [filter];
            } catch (e) {
                console.warn('Failed to apply displacement map:', e);
            }
        }

        app.stage.addChild(designSprite);

        // 4. Render & Extract
        // Use the renderer to extract base64
        const base64 = await app.renderer.extract.base64(app.stage);
        return base64;

    } catch (error) {
        console.error('Error in generateMockupImage:', error);
        throw error;
    } finally {
        // 5. Cleanup
        app.destroy(true);
    }
};
