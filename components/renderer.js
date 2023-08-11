import React from 'react';

import * as twgl from 'twgl.js';
import _ from 'lodash';

import vertex_shader from "../shaders/vs.glsl";
import smart_vs from "../shaders/smart_vs.glsl";
import buffer_a_fs from "../shaders/buffer_a_fs.glsl";
import image_fs from "../shaders/image_fs.glsl";

function get_attachments(uniforms){
  return Object.fromEntries(Object.entries(uniforms).map(([key, value]) => [key, value.attachments[0]]));
}

export default class Renderer extends React.Component{
  constructor(props) {
    super(props);

    this.canvas_ref = React.createRef();
    this.width = props.width;
    this.height = props.height;
  }

  render() {
    this.mouse_pos = [-1, -1];

    const get_mouse_pos = event => {
      var rect = event.target.getBoundingClientRect();
      return [event.clientX - rect.left, this.resolution[1] - (event.clientY - rect.top)];
    }

    const handleMouseMove = event => {
      if(this.is_mouse_down)
      {
        this.mouse_pos = get_mouse_pos(event);
      }
    };

    const handleMouseDown = event => {
      this.is_mouse_down = true;
      this.mouse_pos = get_mouse_pos(event);
    }

    const handleMouseUp = event => {
      this.is_mouse_down = false;
      this.mouse_pos = get_mouse_pos(event);
      this.mouse_pos[0] = -Math.abs(this.mouse_pos[0]);
    }

    return <canvas ref={this.canvas_ref} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} style={{width: this.width, height: this.height, backgroundColor: "black"}}></canvas>
  }

  draw(gl, program, to, uniforms, triangles_buffer_info, mode=gl.TRIANGLES)
  {
    twgl.bindFramebufferInfo(gl, to);

    gl.useProgram(program.program);
    twgl.setBuffersAndAttributes(gl, program, triangles_buffer_info);
    twgl.setUniforms(program, uniforms);
    twgl.drawBufferInfo(gl, triangles_buffer_info, mode);
  }

  componentDidMount() {
    const gl = this.canvas_ref.current.getContext("webgl2");
    gl.getExtension('EXT_color_buffer_float');
    gl.enable(gl.DEPTH_TEST);

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    this.resolution = [gl.canvas.width, gl.canvas.height];
    console.log("resolution: " + this.resolution);

    const image = {};
    const A = {};

    image.program = twgl.createProgramInfo(gl, [smart_vs, image_fs], err => {
      throw Error(err);
    });

    A.program = twgl.createProgramInfo(gl, [vertex_shader, buffer_a_fs], err => {
      throw Error(err);
    });

    const attachments = [
      { format: gl.RGBA, internalFormat: gl.RGBA32F, type: gl.FLOAT, mag: gl.NEAREST, min: gl.NEAREST },
    ];

    A.in_buffer = twgl.createFramebufferInfo(gl, attachments);
    A.out_buffer = twgl.createFramebufferInfo(gl, attachments);

    this.plane_triangles_buffer_info = twgl.createBufferInfoFromArrays(gl, {
      position: [...[-1, -1, 0], ...[1, -1, 0], ...[-1, 1, 0], ...[1, 1, 0]],
      indices: [...[0, 1, 2], ...[2, 1, 3]]
    });

    const min_size = [30, 30];

    Array.prototype.divide = function (other) { return _.zipWith(this, other, _.divide) }
    Array.prototype.add = function (other) { return _.zipWith(this, other, _.add) }
    Array.prototype.multiply = function (other) { return _.zipWith(this, other, _.multiply) }
    Array.prototype.gt = function (other) { return _.zipWith(this, other, _.gt) }
    
    this.pattern_resolution = _.map(this.resolution.divide(min_size), x => _.ceil(x));

    const triangles_pattern = this.generate_triangles(this.pattern_resolution, [2, 2]);

    this.triangles_pattern_buffer_info = twgl.createBufferInfoFromArrays(gl, {
      vertex_index: {data: _.range(this.pattern_resolution[0] * this.pattern_resolution[1]), numComponents: 1, type: Int32Array},
      indices: _.flatten(triangles_pattern)
    });

    const render = (time) => {
        const uniforms = {
            time: time * 0.001,
            resolution: this.resolution,
            min_size: min_size,
            pattern_resolution: this.pattern_resolution,
            mouse_pos: this.mouse_pos,
        };

        gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    
        // this.draw(gl, A.program,     A.out_buffer, {...uniforms, ...get_attachments({buffer_A: A.in_buffer})}, this.plane_triangles_buffer_info);
        this.draw(
          gl, 
          image.program, 
          null,         
          {...uniforms, ...get_attachments({buffer_A: A.in_buffer})}, 
          this.triangles_pattern_buffer_info,
          gl.TRIANGLES
        );

        [A.out_buffer, A.in_buffer] = [A.in_buffer, A.out_buffer]
    
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  generate_triangles(resolution, multiplier)
  {
    const base_pattern = this.generate_base_pattern();

    var triangles = [];

    var size = [2, 2];  // size of base_pattern

    for(var i = 0; i < 1; i += 1)
    {
      const current_pattern = this.map_triangles(base_pattern, coord => _.zipWith(coord, size, (v, s) => v * s / 2));
      
      _.range(0, resolution[0] - size[0], size[0]).map(x => 
        _.range(0, resolution[1] - size[1], size[1]).map(y => {
          triangles = _.concat(triangles, this.map_triangles(current_pattern, coord => coord.add([x, y])))
        })
      )

      if(_.some(size.gt(resolution))) break;

      size = size.multiply(multiplier);
    }

    return this.map_triangles(triangles, coord => coord[1] * resolution[0] + coord[0]);
  }

  generate_base_pattern()
  {
    var pattern = [];
    var rotated_square = [
      [[0, 0], [1, 0], [0, 1]],
      [[1, 0], [0, 1], [1, 1]]
    ];
    _.range(4).map((i) => {
      pattern = _.concat(pattern, rotated_square);
      rotated_square = this.map_triangles(rotated_square, coord => [-coord[1], coord[0]]);
    })

    return this.map_triangles(pattern, coord => _.zipWith(coord, [1, 1], _.add));
  }

  map_triangles(triangles, func)
  {
    return triangles.map(triangle => triangle.map(func));
  }
}
