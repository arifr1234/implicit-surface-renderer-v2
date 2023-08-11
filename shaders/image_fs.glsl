#version 300 es
precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform sampler2D buffer_A;

flat in vec3 v_color;

out vec4 out_color;

void main() {
  out_color = vec4(v_color, 1.);
}