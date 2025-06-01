#version 300 es
// pixel-art.frag - Converted from Unity HLSL shader
// foundryvtt v12 pixijs filter - based on pixel art shader by t3ssel8r https://www.patreon.com/posts/83276362
precision mediump float;

out vec4 fragColor;  // Output color variable for GLSL ES 3.00
// Original texture (not scaled or transformed)
uniform sampler2D uOriginalTexture;
uniform vec2 uTexSize;
uniform float uSpriteAlpha; // Alpha value for the sprite
uniform vec3 uSpriteTint;

uniform vec4 inputClampTarget;

in vec2 vOriginalTextureCoord;

float getClip(vec2 uv) {
    // Each step returns 1.0 if the condition is true, 0.0 if false
    // If all four conditions are true, the sum will be 4.0
    // We need at least 3.5 to ensure all four conditions are met
    bvec4 inBounds = bvec4(
        uv.x >= inputClampTarget.x,
        uv.y >= inputClampTarget.y,
        uv.x <= inputClampTarget.z,
        uv.y <= inputClampTarget.w
    );
    return float(all(inBounds));
}

void main() {    
    // Start with the input texture coordinates (vTextureCoord) from vertex shader
    // These are the normalized coordinates in the filter's space (0 to 1)
    vec2 uv = vOriginalTextureCoord;

    // calculate derivatives once
    vec2 dUVdx = dFdx(uv);
    vec2 dUVdy = dFdy(uv);
    
    // Get dimensions of both textures
    vec2 originalSize = uTexSize;
    
    // Calculate texel sizes for proper sampling
    vec2 originalTexelSize = 1.0 / originalSize;
    
    // Calculate the box filter size using screen-space derivatives
    // This determines how many source texels contribute to one screen pixel
    vec2 boxSize = clamp((abs(dUVdx) + abs(dUVdy)) * originalSize, vec2(1e-5), vec2(1.0));

    // Convert to texel coordinates in the original texture space
    vec2 tx = uv * originalSize - 0.5 * boxSize;
    
    // Calculate sub-texel offset for proper filtering
    vec2 txOffset = smoothstep(vec2(1.0) - boxSize, vec2(1.0), fract(tx));

    // Calculate the final sampling coordinates with proper pixel alignment
    vec2 sampleUV = (floor(tx) + 0.5 + txOffset) * originalTexelSize;

    // Clamp the sample coordinates to the input clamp target
    float clipValue = getClip(sampleUV);

    // Use textureGrad to sample with proper filtering even with variable scaling
    // This preserves sharp pixel edges while avoiding aliasing
    vec4 color = textureGrad(uOriginalTexture, clamp(sampleUV,inputClampTarget.xy,inputClampTarget.zw)*clipValue, dUVdx, dUVdy) * clipValue;
    // Apply the alpha value to the sampled color
    color.rgb *= uSpriteTint;
    color *= uSpriteAlpha;
    fragColor = color;
}