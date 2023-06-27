import React from 'react'

import * as twgl from 'twgl.js'

import vertex_shader from "../shaders/vs.glsl";
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

    return <canvas ref={this.canvas_ref} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} style={{width: this.width, height: this.height}}></canvas>
  }

  draw(gl, program, to, uniforms)
  {
    twgl.bindFramebufferInfo(gl, to);

    gl.useProgram(program.program);
    twgl.setBuffersAndAttributes(gl, program, this.triangles_buffer_info);
    twgl.setUniforms(program, uniforms);
    twgl.drawBufferInfo(gl, this.triangles_buffer_info);
  }

  componentDidMount() {
    const gl = this.canvas_ref.current.getContext("webgl2");
    gl.getExtension('EXT_color_buffer_float');

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    this.resolution = [gl.canvas.width, gl.canvas.height];
    console.log("resolution: " + this.resolution);

    const image = {};
    const A = {};

    image.program = twgl.createProgramInfo(gl, [vertex_shader, image_fs], err => {
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

    this.triangles_buffer_info = twgl.createBufferInfoFromArrays(gl, {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    });
    

    const render = (time) => {
        const uniforms = {
            time: time * 0.001,
            resolution: this.resolution,
            mouse_pos: this.mouse_pos,
        };

        gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    
        this.draw(gl, A.program,     A.out_buffer, {...uniforms, ...get_attachments({buffer_A: A.in_buffer})});
        this.draw(gl, image.program, null,         {...uniforms, ...get_attachments({buffer_A: A.in_buffer})});

        [A.out_buffer, A.in_buffer] = [A.in_buffer, A.out_buffer]
    
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
}
