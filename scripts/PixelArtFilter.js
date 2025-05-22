import { hexToRgb } from "./lib/lib.js";
// shaders are pulled in by gulp code during build
let fragmentShader = `#version 300 es
// pixel-art.frag - Converted from Unity HLSL shader
// foundryvtt v12 pixijs filter - based on pixel art shader by t3ssel8r https://www.patreon.com/posts/83276362
precision mediump float;

out vec4 fragColor;  // Output color variable for GLSL ES 3.00
// Original texture (not scaled or transformed)
uniform sampler2D uOriginalTexture;
uniform float uSpriteAlpha; // Alpha value for the sprite
uniform vec3 uSpriteTint;

uniform vec4 inputClampTarget;

in vec2 vOriginalTextureCoord;

float getClip(vec2 uv) {
    return step(3.5,
       step(inputClampTarget.x, uv.x) +
       step(inputClampTarget.y, uv.y) +
       step(uv.x, inputClampTarget.z) +
       step(uv.y, inputClampTarget.w));
}

void main() {    // Start with the input texture coordinates (vTextureCoord) from vertex shader
    // These are the normalized coordinates in the filter's space (0 to 1)
    vec2 uv = vOriginalTextureCoord;
    
    // Get dimensions of both textures
    vec2 originalSize = vec2(textureSize(uOriginalTexture, 0));
    
    // Calculate texel sizes for proper sampling
    vec2 originalTexelSize = 1.0 / originalSize;
    
    // Calculate the box filter size using screen-space derivatives
    // This determines how many source texels contribute to one screen pixel
    vec2 boxSize = clamp(fwidth(uv) * originalSize, vec2(1e-5), vec2(1.0));
    
    // Convert to texel coordinates in the original texture space
    vec2 tx = uv * originalSize - 0.5 * boxSize;
    
    // Calculate sub-texel offset for proper filtering
    vec2 txOffset = smoothstep(vec2(1.0) - boxSize, vec2(1.0), fract(tx));

    // Calculate the final sampling coordinates with proper pixel alignment
    vec2 sampleUV = (floor(tx) + 0.5 + txOffset) * originalTexelSize;

    // Use textureGrad to sample with proper filtering even with variable scaling
    // This preserves sharp pixel edges while avoiding aliasing
    vec4 color = textureGrad(uOriginalTexture, clamp(sampleUV,inputClampTarget.xy,inputClampTarget.zw)*getClip(sampleUV), dFdx(uv), dFdy(uv)) * getClip(sampleUV);
    // Apply the alpha value to the sampled color
    color.rgb *= uSpriteTint;
    color *= uSpriteAlpha;
    fragColor = color;
}`;
let vertexShader = `#version 300 es
precision mediump float;
in vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform mat3 uOriginalUVMatrix;

out vec2 vTextureCoord;
out vec2 vOriginalTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition(void) {
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.f)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0f)).xy, 0.0f, 1.0f);
}

vec2 filterTextureCoord(void) {
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
    vOriginalTextureCoord = (uOriginalUVMatrix * vec3(vTextureCoord, 1.0f)).xy;
}`;
/**
 * A PIXI filter that renders pixel art with crisp, clean edges at any scale.
 *
 * The PixelPerfectFilter maintains the visual integrity of pixel art textures
 * when scaled or transformed in Foundry VTT. It prevents texture blurring and
 * anti-aliasing that would otherwise degrade the appearance of pixel art.
 *
 * This filter works by:
 * 1. Capturing the original texture from a Token or Tile
 * 2. Applying custom shader logic to ensure pixel-perfect rendering
 * 3. Maintaining proper alpha transparency and tint color
 *
 * @extends PIXI.Filter
 *
 * @example
 * ```typescript
 * // Apply to a token
 * const filter = new PixelPerfectFilter(myToken);
 * myToken.filters = [...(myToken.filters || []), filter];
 * ```
 *
 * @remarks
 * - Compatible with both Foundry VTT v11 and v12
 * - Handles different tint color formats between versions
 * - Requires the target object to have a valid texture
 * - Should be properly destroyed when no longer needed to prevent risk of memory leaks
 */
export class PixelPerfectFilter extends PIXI.Filter {
    originalUVMatrix;
    targetSprite;
    originalTexture;
    constructor(filterTarget) {
        const originalUVMatrix = new PIXI.Matrix();
        super(vertexShader, fragmentShader);
        this.uniforms.uOriginalUVMatrix = originalUVMatrix;
        this.originalUVMatrix = originalUVMatrix;
        // Update texture uniforms
        // if (filterTarget instanceof PrimarySpriteMesh) {
        //   this.updateSpriteData(filterTarget);
        // } else 
        if (filterTarget?.texture) {
            this.updatePlaceableData(filterTarget);
            console.log("pixel-perfect: Texture assigned to filter");
        }
        else {
            console.warn(`pixel-perfect: No texture found for placeable ${filterTarget.id}, skipping filter application.`);
        }
        this.autoFit = false;
    }
    /**
     * Updates the sprite data for the pixel art filter.
     *
     * This method sets up the original texture from the sprite mesh and applies it to the filter's uniforms.
     * It also ensures the sprite mesh has rounded pixels for better pixel-perfect rendering.
     *
     * @param spriteMesh - The primary sprite mesh to extract texture data from and apply pixel-perfect settings to
     * @returns void - Returns early if the sprite mesh doesn't have a valid texture resource
     */
    updateSpriteData(spriteMesh) {
        if (!spriteMesh.texture?.baseTexture?.resource)
            return;
        let tex = PIXI.Texture.from(spriteMesh.texture.baseTexture.resource);
        //console.log("pixel-perfect: Texture from sprite mesh", tex);
        if (!tex.valid) {
            console.warn(`pixel-perfect: Texture is not valid for sprite mesh ${spriteMesh}, skipping filter application.`);
            return;
        }
        this.originalTexture = tex;
        this.uniforms.uOriginalTexture = this.originalTexture;
        spriteMesh.roundPixels = true;
        this.targetSprite = spriteMesh;
    }
    /**
     * Updates the filter with data from a placeable (Token or Tile) object.
     *
     * This method extracts necessary information from the placeable to update the
     * filter's uniforms, including sprite data, alpha transparency, and tint color.
     * It handles version compatibility for Foundry VTT v11 and v12.
     *
     * @param placeable - The Token or Tile object whose data will be used to update the filter
     * @returns {void}
     *
     * @remarks
     * - Requires the placeable to have a valid mesh property
     * - Will skip application and log a warning if no sprite mesh is found
     * - Handles different tint color formats between Foundry VTT versions
     */
    updatePlaceableData(placeable) {
        let spriteMesh = placeable.mesh;
        if (!spriteMesh) {
            console.warn(`pixel-perfect: No sprite mesh found for placeable ${placeable.id}, skipping filter application.`);
            return;
        }
        this.updateSpriteData(spriteMesh);
        // Update the alpha uniform, from the placeable document
        this.uniforms.uSpriteAlpha = placeable.document?.alpha;
        if (game.release && parseFloat(game.release.version) >= 12) {
            // update the tint color uniform, from the placeable document. default to white if not set
            this.uniforms.uSpriteTint = placeable.document?.texture?.tint?.rgb || [1, 1, 1];
        }
        else {
            const tintHex = placeable.document?.texture?.tint || '#ffffff';
            // @ts-ignore
            this.uniforms.uSpriteTint = hexToRgb(tintHex);
        }
    }
    /**
     * Applies the pixel art filter to the rendered content.
     *
     * This method is called by PIXI's filter system during rendering. It prepares the original texture
     * for use in the shader by setting up the necessary uniforms, including the texture itself and
     * the UV transformation matrices required for proper mapping.
     *
     * @param filterManager - The PIXI FilterSystem managing the rendering pipeline
     * @param input - The input render texture to apply the filter to
     * @param output - The output render texture where the filtered result will be stored
     * @param clear - The clear mode to use when applying the filter
     *
     * @returns void - The method returns early without applying the filter if the original texture is invalid
     */
    apply(filterManager, input, output, clear) {
        const texture = this.originalTexture;
        if (texture.valid) {
            if (!texture.uvMatrix)
                texture.uvMatrix = new PIXI.TextureMatrix(texture, 0.0);
            texture.uvMatrix.update();
            this.uniforms.uOriginalTexture = texture;
            this.uniforms.uOriginalUVMatrix = filterManager
                .calculateSpriteMatrix(this.originalUVMatrix, this.targetSprite)
                .prepend(texture.uvMatrix.mapCoord);
            this.uniforms.inputClampTarget = texture.uvMatrix.uClampFrame;
        }
        else {
            console.warn("pixel-perfect: Texture is not valid, skipping filter application.");
            return;
        }
        super.apply(filterManager, input, output, clear);
    }
    /**
     * Destroys the PixelArtFilter instance, releasing references to resources for garbage collection.
     *
     * This method should be called when the filter is no longer needed to prevent memory leaks.
     * It nullifies references to the original texture, target sprite, and original UV matrix.
     */
    destroy() {
        // Null out references for GC
        this.originalTexture = undefined;
        this.targetSprite = undefined;
        this.originalUVMatrix = undefined;
    }
}
