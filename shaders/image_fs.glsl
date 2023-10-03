#version 300 es
precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform sampler2D buffer_A;
uniform float wireframe;

in vec3 v_color;
in float to_discard;

out vec4 out_color;

void main() {
  out_color = vec4((1. - wireframe) * v_color, 1.);

  if(to_discard != 0.) discard;
}