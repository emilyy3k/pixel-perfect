import{hexToRgb}from"./lib/lib.js";let fragmentShader=`#version 300 es
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
}`,vertexShader=`#version 300 es
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
}`;class PixelPerfectFilter extends PIXI.Filter{originalUVMatrix;targetSprite;originalTexture;constructor(e){var t=new PIXI.Matrix;super(vertexShader,fragmentShader),this.uniforms.uOriginalUVMatrix=t,this.originalUVMatrix=t,e?.texture?(this.updatePlaceableData(e),console.log("pixel-perfect: Texture assigned to filter")):console.warn(`pixel-perfect: No texture found for placeable ${e.id}, skipping filter application.`),this.autoFit=!1}updateSpriteData(e){var t;e.texture&&((t=e.texture).valid?(this.originalTexture=t,this.uniforms.uOriginalTexture!==this.originalTexture&&(this.uniforms.uOriginalTexture=this.originalTexture),e.roundPixels||(e.roundPixels=!0),this.targetSprite=e):console.warn(`pixel-perfect: Texture is not valid for sprite mesh ${e}, skipping filter application.`))}updatePlaceableData(t){var i=t.mesh;if(i){this.updateSpriteData(i);var i=t.document?.alpha||1;this.uniforms.uSpriteAlpha!==i&&(this.uniforms.uSpriteAlpha=i);let e=null;null!==(e=game.release&&12<=parseFloat(game.release.version)?t.document?.texture?.tint?.rgb||[1,1,1]:(i=t.document?.texture?.tint||"#ffffff",hexToRgb(i)))&&this.uniforms.uSpriteTint!==e&&(this.uniforms.uSpriteTint=e)}else console.warn(`pixel-perfect: No sprite mesh found for placeable ${t.id}, skipping filter application.`)}apply(e,t,i,r){var a=this.originalTexture;a.uvMatrix||(a.uvMatrix=new PIXI.TextureMatrix(a,0)),a.uvMatrix.update(),this.uniforms.uOriginalTexture!==a&&(this.uniforms.uOriginalTexture=a),this.uniforms.uOriginalUVMatrix=e.calculateSpriteMatrix(this.originalUVMatrix,this.targetSprite).prepend(a.uvMatrix.mapCoord),this.uniforms.inputClampTarget=a.uvMatrix.uClampFrame,super.apply(e,t,i,r)}destroy(){this.originalTexture=void 0,this.targetSprite=void 0,this.originalUVMatrix=void 0}}export{PixelPerfectFilter};
//# sourceMappingURL=PixelArtFilter.js.map
