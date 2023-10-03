#version 300 es
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 min_size;
uniform ivec2 pattern_resolution;
uniform vec2 mouse_pos;
uniform float wireframe;

in int vertex_index;

out vec3 v_color;  // TODO: remove + in fs
out float to_discard;

#define sq(x) dot(x, x)

int ctz(int x){ 
  if(x == 0) return 32;
  return int(log2(float(x & (-x))));
}

vec3 hsv2rgb_smooth( in vec3 c );

void main() {
  gl_PointSize = 10.; // max(min_size.x, min_size.y);

  ivec2 coord = ivec2(int(vertex_index) % pattern_resolution.x, int(vertex_index) / pattern_resolution.x);

  vec2 position = min_size * vec2(coord);

  int z_index = min(ctz(coord.x), ctz(coord.y));

  float z = float(z_index) / 40.;  // TODO: dafuck?

  v_color = hsv2rgb_smooth(vec3(0.5 + float(z_index) * 1.618, 1, 0.3 + float(z_index) / 3.));


  if(wireframe > 0.5) z = -1.;

  gl_Position = vec4(2. * position / resolution - 1., z, 1);

  // int min_z_index = int(floor(time / 3.)) % 4;

  // if(z_index < min_z_index) discard;
  to_discard = 0.;
  // if(coord == ivec2(0)) to_discard = 1.;
  // if(coord == ivec2(16, 16)) to_discard = 1.;
  // if(coord == ivec2(8, 8)) to_discard = 1.;
  // if(coord == ivec2(4, 4)) to_discard = 1.;
  // if(coord == ivec2(2, 2)) to_discard = 1.;

  // if(z_index < 5) to_discard = 1.;

  if(abs(mouse_pos) == mouse_pos && sq(position - mouse_pos) < sq(50.)) to_discard = 1.;
}


vec3 hsv2rgb_smooth( in vec3 c )
{
  vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

	rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

	return c.z * mix( vec3(1.0), rgb, c.y);
}
