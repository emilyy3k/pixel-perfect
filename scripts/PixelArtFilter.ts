import { hexToRgb } from "./lib/lib.js";

// shaders are pulled in by gulp during build
let fragmentShader = `...`;
let vertexShader = `...`;

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
  originalUVMatrix!: PIXI.Matrix;
  targetSprite!: SpriteMesh;
  originalTexture!: PIXI.Texture;

  constructor(filterTarget: Token | Tile) {
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
    } else {
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
   * @returns {void} - Returns early if the sprite mesh doesn't have a valid texture resource
   */
  updateSpriteData(spriteMesh: PrimarySpriteMesh): void {
    if (!spriteMesh.texture) return;
    let tex = spriteMesh.texture
    //console.log("pixel-perfect: Texture from sprite mesh", tex);
    if (!tex.valid) {
      console.warn(`pixel-perfect: Texture is not valid for sprite mesh ${spriteMesh}, skipping filter application.`);
      return;
    }

    this.originalTexture = tex;
    
    // If the texture object has changed, update the uniforms
    if (this.uniforms.uOriginalTexture !== this.originalTexture) {
      this.uniforms.uOriginalTexture = this.originalTexture;
    }

    if (!spriteMesh.roundPixels) {
      spriteMesh.roundPixels = true;
    }
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
  updatePlaceableData(placeable: Token | Tile): void {
    let spriteMesh = placeable.mesh;
    if (!spriteMesh) {
      console.warn(`pixel-perfect: No sprite mesh found for placeable ${placeable.id}, skipping filter application.`);
      return;
    }
    this.updateSpriteData(spriteMesh);

    const placeableAlpha = placeable.document?.alpha || 1.0;
    
    // If the sprite alpha has changed, update the uniform
    if (this.uniforms.uSpriteAlpha !== placeableAlpha) {
      // Update the alpha uniform, from the placeable document
      this.uniforms.uSpriteAlpha = placeableAlpha;
    }


    let newTint = null;
    // update the tint color uniform, from the placeable document. default to white if not set
    // Foundry v12 uses a different format for tint colors
    if (game.release && parseFloat(game.release.version) >= 12) {
      newTint = placeable.document?.texture?.tint?.rgb || [1, 1, 1];
    } else {
      const tintHex = placeable.document?.texture?.tint || '#ffffff';
      // @ts-ignore
      newTint = hexToRgb(tintHex);
    }

    // If the tint color has changed, update the uniform
    if (newTint !== null && this.uniforms.uSpriteTint !== newTint) {
      this.uniforms.uSpriteTint = newTint;
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
   * @returns {void} - The method returns early without applying the filter if the original texture is invalid
   */
  apply(filterManager: PIXI.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture, clear: PIXI.CLEAR_MODES): void {
    const texture = this.originalTexture;

    if (!texture.uvMatrix) texture.uvMatrix = new PIXI.TextureMatrix(texture, 0.0);
    texture.uvMatrix.update();

    if (this.uniforms.uOriginalTexture !== texture) {
      this.uniforms.uOriginalTexture = texture;
    }
    
    this.uniforms.uOriginalUVMatrix = filterManager
      .calculateSpriteMatrix(this.originalUVMatrix, this.targetSprite as any)
      .prepend(texture.uvMatrix.mapCoord);
    this.uniforms.inputClampTarget = texture.uvMatrix.uClampFrame;

    super.apply(filterManager, input, output, clear);
  }

  /**
   * Destroys the PixelArtFilter instance, releasing references to resources for garbage collection.
   * 
   * This method should be called when the filter is no longer needed to prevent memory leaks.
   * It nullifies references to the original texture, target sprite, and original UV matrix.
   */
  destroy(): void {
    // Null out references for GC
    this.originalTexture = undefined as any;
    this.targetSprite = undefined as any;
    this.originalUVMatrix = undefined as any;
  }
}
