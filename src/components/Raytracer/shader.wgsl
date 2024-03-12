struct VertexOut {
  @builtin(position) position : vec4f,
}

// TODO: pass canvas dimensions as uniforms instead of hardcode
const WIDTH = 1744;
const HEIGHT = 1716;

@vertex
fn vertex_main(@location(0) position: vec4f) -> VertexOut
{
  var output : VertexOut;
  output.position = position;
  return output;
}

@fragment
fn fragment_main(vertexData: VertexOut) -> @location(0) vec4f
{
  return vec4f(vertexData.position.xy / vec2f(WIDTH, HEIGHT), 0.0, 1);
}
