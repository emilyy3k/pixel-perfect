#version 300 es
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
}