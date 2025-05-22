![](https://img.shields.io/badge/Foundry-v12-informational)<!--- Downloads @ Latest Badge --><!--- replace <user>/<repo> with your username/repository --> ![Latest Release Download Count](https://img.shields.io/github/downloads/emily3k/pixel-perfect/latest/module.zip)<!--- Forge Bazaar Install % Badge --><!--- replace <your-module-name> with the `name` in your manifest --> ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fpixel-perfect&colorB=4aa94a)

# Pixel Perfect - Pixel Art Scaling

No longer do we have to choose between a blurry mess or crunchy jittery pixels! Pixel Perfect applies a filter to your tokens and tiles to bring out the pixel art goodness. 

## Examples

![PIXEL PERFECT ZOOMED IN](https://github.com/user-attachments/assets/6b61b13c-4c90-464e-a519-695d02a1c11d)
![PIXEL PERFECT ZOOMED OUT](https://github.com/user-attachments/assets/3d78d793-3a25-493f-91fc-7da20f2ee7a7)

## Technical details
Pixel Perfect applies a PIXI.Filter to all tokens and tiles in the scene, to re-sample the original texture using a glsl shader based off of [t3ssel8r's pixel art scaling shader for unity](https://www.youtube.com/watch?v=d6tp43wZqps). As we're applying a filter to a lot of objects, this could come with some level of performance drop. However, if you want your pixel art to shine, there's no substitute.  
Based on my limited knowledge of foundry, using a filter seemed like the best way to make this module as widely compatible as possible. Currently there's only a single line that needs to be treated differently between v11 and v12, and it doesn't even have anything to do with the filter. Doing some sort of deeper overwrite of foundry functions would likely be a lot more unstable and require a lot more work to fix compatibility issues.
