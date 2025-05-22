#version 300 es
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
}