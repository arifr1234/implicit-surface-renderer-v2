#version 300 es

uniform vec2 resolution;
uniform vec2 min_size;
uniform ivec2 pattern_resolution;

in int vertex_index;

flat out vec3 v_color;  // TODO: remove + in fs

int ctz(int x){ 
  if(x == 0) return 32;
  return int(log2(float(x & (-x))));
}

vec3 hsv2rgb_smooth( in vec3 c );

void main() {
  ivec2 coord = ivec2(int(vertex_index) % pattern_resolution.x, int(vertex_index) / pattern_resolution.x);

  vec2 position = min_size * vec2(coord);

  int z_index = min(ctz(coord.x), ctz(coord.y));

  float z = -1. / (float(z_index) + 1.1);  // TODO: dafuck?

  v_color = hsv2rgb_smooth(vec3(0.5 + float(z_index) * 1.618, 1, float(z_index) / 3.));


  gl_Position = vec4(2. * position / resolution - 1., z, 1);
}


vec3 hsv2rgb_smooth( in vec3 c )
{
  vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

	rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

	return c.z * mix( vec3(1.0), rgb, c.y);
}
