// pixel-perfect module for Foundry VTT v12
import { PixelPerfectFilter } from "./PixelArtFilter.js";

// Usage in Foundry VTT
Hooks.on('canvasReady', async () => {
  console.log("pixel-perfect: Canvas is ready, initializing.");
  
  const pixelFilters: Map<string, PixelPerfectFilter> = new Map();
  
  /**
   * Applies a PixelPerfectFilter to a placeable object (Token or Tile).
   * 
   * This function manages the lifecycle of pixel filters for game objects:
   * - Creates a new filter if one doesn't exist for this placeable
   * - Updates existing filters with the latest placeable data
   * - Cleans up orphaned filters (when target objects change)
   * - Adds the filter to the object's render pipeline if not already present
   * - Configures texture settings to prevent rendering artifacts
   * 
   * @param {Token | Tile} placeable - The Token or Tile object to apply the pixel perfect filter to
   * @returns void
   * 
   * @remarks
   * The function requires the placeable to have a valid mesh property.
   * It stores filters in a global pixelFilters Map using the placeable's ID as the key.
   * Texture settings are adjusted to LINEAR scaling with mipmapping to prevent jittering
   * while maintaining crisp pixel art rendering.
   */
  const applyFilterToPlaceable = (placeable: Token | Tile) => {
    if (!placeable?.mesh) {
      console.log("pixel-perfect: Placeable has no sprite or texture", placeable?.id);
      return;
    }

    //console.log(`pixel-perfect: Applying filter to placeable ${placeable.id}`);

    let pixelFilter = pixelFilters.get(placeable.id);
    let targetObj = placeable.mesh;

    // Filter for orphaned filters
    if (pixelFilter?.targetSprite && pixelFilter.targetSprite !== targetObj) {
      if (pixelFilter.targetSprite.filters) {
        pixelFilter.targetSprite.filters = pixelFilter.targetSprite.filters.filter(f => f !== pixelFilter);
        if (pixelFilter.targetSprite.filters.length === 0) pixelFilter.targetSprite.filters = null;
      }
    }

    // Create a new filter if needed
    if (!pixelFilter) {
      console.log(`pixel-perfect: Creating new filter for placeable ${placeable.id}`);
      pixelFilter = new PixelPerfectFilter(placeable);
      pixelFilters.set(placeable.id, pixelFilter);
    }

    // Always update the filter's sprite/texture reference
    pixelFilter.updatePlaceableData(placeable);

    // Add our filter if it's not already there
    const hasFilter = targetObj.filters?.some(f => f === pixelFilter) || false;
    if (!hasFilter) {
      console.log(`pixel-perfect: Adding filter to placeable sprite ${placeable.id}`);
      if (!targetObj.filters) targetObj.filters = [];
      targetObj.filters.push(pixelFilter);
      console.log(`pixel-perfect: Filter added, total filters: ${targetObj.filters.length}`);
      if (placeable.texture?.baseTexture) {
        // using linear to avoid jittering. end result will still be sharp.
        placeable.texture.baseTexture.setStyle(PIXI.SCALE_MODES.LINEAR, PIXI.MIPMAP_MODES.ON);
        if (!placeable.texture.baseTexture.valid) {
          placeable.texture.baseTexture.update();
        }
      }
    }
    //targetObj.cacheAsBitmap = false;
    placeable.texture?.update();
  };

  // const applyFilterToEnvironment = () => {
  //   // @ts-ignore
  //   const foreground = canvas.environment.primary.foreground as PrimarySpriteMesh;
  //   // @ts-ignore
  //   const background = canvas.environment.primary.background as PrimarySpriteMesh;
  //   // quick environment object to loop through
  //   const environment = {foreground: {mesh: foreground, id: "foreground"}, background: {mesh: background, id: "background"}};

  //   for (const [id, {mesh}] of Object.entries(environment)) {
  //     if (!mesh.texture?.baseTexture.resource) {
  //       console.warn(`pixel-perfect: No texture found for environment ${id}, skipping filter application.`);
  //       continue;
  //     }
  //     let pixelFilter = pixelFilters.get(id);

  //     // Create a new filter if needed
  //     if (!pixelFilter) {
  //       console.log(`pixel-perfect: Creating new filter for environment ${id}`);
  //       pixelFilter = new PixelPerfectFilter(mesh);
  //       pixelFilters.set(id, pixelFilter);
  //     }

  //     pixelFilter.updateSpriteData(mesh);
  //   }
  // };

  // Delete filter instance
  /**
   * Removes and cleans up a pixel filter instance associated with a placeable object.
   * 
   * @param placeable - The Token or Tile from which to remove the filter
   * 
   * @remarks
   * This function:
   * 1. Checks if the placeable has an associated filter in the pixelFilters map
   * 2. Removes the filter from the placeable's mesh filters array
   * 3. Sets filters to null if no filters remain (for memory efficiency)
   * 4. Calls the filter's destroy method if it exists
   * 5. Removes the filter reference from the pixelFilters map
   */
  const deleteFilterInstance = (placeable: Token | Tile) => {

    // Check if the placeable has a filter instance
    const filter = pixelFilters.get(placeable.id);
    // teardown the full size texture sampler
    //filter?.uOriginalTexture?.destroy(true);
    if (filter) {
      console.log(`pixel-perfect: Deleting filter instance for placeable ${placeable.id}`);
      // Remove the filter from the placeable
      const targetObj = placeable.mesh;
      if (targetObj && targetObj.filters) {
        targetObj.filters = targetObj.filters.filter(f => f !== filter);
        // If there are no filters left, set it to null for memory efficiency reasons (according to PIXI docs)
        if (targetObj.filters.length === 0) targetObj.filters = null;
      }
      if (typeof filter.destroy === "function") filter.destroy();
      pixelFilters.delete(placeable.id);
    }
  };

  // Apply filter to background & foreground
  //applyFilterToEnvironment();
  
  // Apply filter when a token refreshes
  Hooks.on('refreshToken', applyFilterToPlaceable);
  Hooks.on('updateToken', applyFilterToPlaceable);
  Hooks.on('createToken', applyFilterToPlaceable);

  Hooks.on('refreshTile', applyFilterToPlaceable);
  Hooks.on('updateTile', applyFilterToPlaceable);
  Hooks.on('createTile', applyFilterToPlaceable);

  // Apply filters to all existing tokens
  if (canvas.tokens) {
    for (const token of canvas.tokens.placeables) {
      applyFilterToPlaceable(token);
    }
  }

  if (canvas.tiles) {
    for (const tile of canvas.tiles.placeables) {
      applyFilterToPlaceable(tile);
    }
  }
  
  // Clean up when a token is deleted
  Hooks.on('deleteToken', deleteFilterInstance);

  // Clean up when a tile is deleted
  Hooks.on('deleteTile', deleteFilterInstance);
  
  // Cleanup on canvas tear down
  Hooks.on('canvasTearDown', () => {
    console.log("pixel-perfect: Canvas tear down, cleaning up filters.");
    
    // Remove our hooks - be specific to avoid removing others' hooks
    Hooks.off('refreshToken', applyFilterToPlaceable);
    Hooks.off('refreshTile', applyFilterToPlaceable);
    Hooks.off('updateToken', applyFilterToPlaceable);
    Hooks.off('updateTile', applyFilterToPlaceable);
    Hooks.off('deleteToken', deleteFilterInstance);
    Hooks.off('deleteTile', deleteFilterInstance);
    // look through all placeables in the pixelFilters map and remove the filter
    for (const [id, filter] of pixelFilters) {
      //let spriteMesh = null;
      // if (id === "foreground" || id === "background") {
      //   // @ts-ignore
      //   spriteMesh = canvas.environment.primary[id] as PrimarySpriteMesh;
      // } else {
      const placeable = canvas.tokens?.get(id) || canvas.tiles?.get(id);
      const spriteMesh = placeable?.mesh;
      //}
      if (spriteMesh) {
        console.log(`pixel-perfect: Cleaning up filters for placeable ${id}`);
        // check if the placeable's mesh has an instance of the filter, and if it does, remove just that one.
        spriteMesh.filters = spriteMesh.filters?.filter(f => !(f instanceof PixelPerfectFilter)) || null;
        // If there are no filters left, set it to null for memory efficiency reasons (according to PIXI docs)
        if (spriteMesh.filters?.length === 0) spriteMesh.filters = null;
      }
    }
    
    // Clear the filter map
    pixelFilters.clear();
  });
});