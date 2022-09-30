import React from 'react'

import * as twgl from 'twgl.js'

import vertex_shader from "../shaders/vs.glsl";
import fragment_shader from "../shaders/fs.glsl";

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

  componentDidMount() {
    const gl = this.canvas_ref.current.getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vertex_shader, fragment_shader]);
  
    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    console.log(gl.canvas.width);
    console.log(gl.canvas.height);

    function render(time) {
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
        const uniforms = {
            time: time * 0.001,
            resolution: [gl.canvas.width, gl.canvas.height],
        };
    
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);
    
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
}
