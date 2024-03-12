struct Uniforms {
  width: u32,
  height: u32,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOut {
  @builtin(position) position : vec4f,
}

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
  return vec4f(
    vertexData.position.x / f32(uniforms.width),
    vertexData.position.y / f32(uniforms.height),
    0.0,
    1.0,
  );
}
