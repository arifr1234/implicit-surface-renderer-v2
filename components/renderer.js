import React from 'react'

import * as twgl from 'twgl.js'

import vertex_shader from "../shaders/vs.glsl";
import fragment_shader from "../shaders/fs.glsl";
import fragment_shader2 from "../shaders/fs2.glsl";

export default class Renderer extends React.Component{
  constructor(props) {
    super(props);

    this.canvas_ref = React.createRef();
    this.width = props.width;
    this.height = props.height;
  }

  render() {
    return <canvas ref={this.canvas_ref} style={{width: this.width, height: this.height}}></canvas>
  }

  draw(gl, program, to, from, uniforms, vertex_buffer)
  {
      twgl.bindFramebufferInfo(gl, to);

      gl.useProgram(program.program);
      twgl.setBuffersAndAttributes(gl, program, vertex_buffer);
      twgl.setUniforms(program, Object.assign({}, uniforms, { buffer_A: from.attachments[0] }));
      twgl.drawBufferInfo(gl, vertex_buffer);
  }

  componentDidMount() {
    const gl = this.canvas_ref.current.getContext("webgl2");
    gl.getExtension('EXT_color_buffer_float');

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    const resolution = [gl.canvas.width, gl.canvas.height];
    console.log(resolution);

    const image = {};
    const A = {};

    image.program = twgl.createProgramInfo(gl, [vertex_shader, fragment_shader2], err => {
      throw Error(err);
    });

    A.program = twgl.createProgramInfo(gl, [vertex_shader, fragment_shader], err => {
      throw Error(err);
    });

    const attachments = [
      { format: gl.RGBA, internalFormat: gl.RGBA32F, type: gl.FLOAT, mag: gl.NEAREST, min: gl.NEAREST },
    ];

    A.in_buffer = twgl.createFramebufferInfo(gl, attachments);
    A.out_buffer = twgl.createFramebufferInfo(gl, attachments);
  
    const triangles_buffer_info = twgl.createBufferInfoFromArrays(gl, {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    });
    

    const render = (time) => {
        const uniforms = {
            time: time * 0.001,
            resolution: resolution,
        };

        gl.viewport(0, 0, resolution[0], resolution[1]);
    
        this.draw(gl, A.program, A.out_buffer, A.in_buffer, uniforms, triangles_buffer_info);
        this.draw(gl, image.program, null, A.in_buffer, uniforms, triangles_buffer_info);

        [A.out_buffer, A.in_buffer] = [A.in_buffer, A.out_buffer]
    
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
}
