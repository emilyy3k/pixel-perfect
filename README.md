![](https://img.shields.io/badge/Foundry-v12-informational)<!--- Downloads @ Latest Badge --><!--- replace <user>/<repo> with your username/repository --> ![Latest Release Download Count](https://img.shields.io/github/downloads/emily3k/pixel-perfect/latest/module.zip)<!--- Forge Bazaar Install % Badge --><!--- replace <your-module-name> with the `name` in your manifest --> ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fpixel-perfect&colorB=4aa94a)

# Pixel Perfect - Pixel Art Scaling

Pixel Perfect enhances pixel art rendering in Foundry VTT, allowing for scaling, skewing, and rotating pixel art without common artifacts, all while maintaining sharpness!

No longer do we have to choose between a blurry mess or crunchy jittery pixels! Pixel Perfect applies a filter to your tokens and tiles to bring out the pixel art goodness. Mobile Compatible! Works with animated sprites! 

## Examples
*(Below Token Art by [Retrograde Minis](https://retrogrademinis.com/))*  

Foundry's default scaling method looks good at a distance, but leaves your art blurry when close up.  
![PIXEL PERFECT ZOOMED IN](https://github.com/user-attachments/assets/6b61b13c-4c90-464e-a519-695d02a1c11d)
The other common method, Nearest Neighbor filtering, looks good close up, but at a distance leaves pixels looking crunchy, and will produce temporal artifacts leading to high levels of pixel jitter in motion.  
![PIXEL PERFECT ZOOMED OUT](https://github.com/user-attachments/assets/3d78d793-3a25-493f-91fc-7da20f2ee7a7)
Pixel Perfect gives you the best of both worlds! Sharp art up close, smooth art from a distance, and ultra temporal stability!  

## Technical details
Pixel Perfect applies a PIXI.Filter to all tokens and tiles in the scene, to re-sample the original texture using a glsl shader based off of [t3ssel8r's pixel art scaling shader for unity](https://www.youtube.com/watch?v=d6tp43wZqps). As we're applying a filter to a lot of objects, this could come with some level of performance drop. I haven't managed to profile exactly what kind of performance hit this might entail. However, if you want your pixel art to shine, there's no substitute.  
Based on my limited knowledge of foundry, using a filter seemed like the best way to make this module as widely compatible as possible. Currently there's only a single line that needs to be treated differently between v11 and v12, and it doesn't even have anything to do with the filter. Doing some sort of deeper overwrite of foundry functions would likely be a lot more unstable and require a lot more work to fix compatibility issues.

## Known Issues
- Due to the way the filter works, it is currently incompatible with v12's dynamic token rings. This will hopefully be remedied in future in some way.
- When opening a token's settings, it will snap back to the default blurry scaling, and then return to Pixel Perfect as soon as any changes are made or the token config menu is closed.

## Known Module/System Incompatibilities
- None as of yet! If you find any, let us know!

## Future Updates
- v13 Compatibility
- Enable or Disable Pixel Perfect for Tiles or Tokens, rather than it just being enabled on both at all times
- Per-Map/Scene enabling or disabling of Pixel Perfect for Tiles or Tokens
- Per-object configuration of Pixel Perfect
- Pixel Perfect for foreground and background images
