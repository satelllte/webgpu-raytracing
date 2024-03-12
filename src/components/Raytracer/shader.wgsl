// const PI = 3.14159265358979;

struct Uniforms {
  width: u32,
  height: u32,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertex_main(@location(0) position: vec4f) -> @builtin(position) vec4f
{
  return position;
}

@fragment
fn fragment_main(@builtin(position) position: vec4f) -> @location(0) vec4f
{
  let width = f32(uniforms.width);
  let height = f32(uniforms.height);
  let aspect_ratio = width / height;
  
  var uv = position.xy / vec2f(width, height);
  uv = (2.0 * uv - vec2f(1.0)) * vec2f(aspect_ratio, -1.0); // mapping `uv` from y-down (normalized) viewport coordinates to camera coordinates

  // let camera_field_of_view_degrees = 75.0;
  // let camera_field_of_view_radians = camera_field_of_view_degrees * PI / 180.0;
  let camera_focus_distance = 1.0;
  let camera_origin = vec3f(0.0, 0.0, -5.0);
  let ray = Ray(
    camera_origin,
    normalize(vec3f(
      uv,
      // (2.0 * (uv.x + 0.5) / width  - 1.0) * tan(camera_field_of_view_radians * 0.5) * aspect_ratio,
      // (2.0 * (uv.y + 0.5) / height - 1.0) * tan(camera_field_of_view_radians * 0.5),
      camera_focus_distance,
    )),
  );

  let sphere = Sphere(vec3f(0.0, 0.0, 0.0), 1.0);

  if (intersect_sphere(sphere, ray)) {
    return vec4f(0.9, 0.1, 0.3, 1.0);
  }

  return sky_color(ray);
}

struct Ray {
  origin: vec3f,
  direction: vec3f, // must be normalized
}

struct Sphere {
  center: vec3f,
  radius: f32,
}

fn intersect_sphere(sphere: Sphere, ray: Ray) -> bool
{
  let v = ray.origin - sphere.center;
  let a = dot(ray.direction, ray.direction);
  let b = dot(v, ray.direction);
  let c = dot(v, v) - sphere.radius * sphere.radius;

  let d = b * b - a * c;
  if d < 0.0 {
    return false;
  }

  let sqrt_d = sqrt(d);
  let recip_a = 1.0 / a;
  let mb = -b;
  let t1 = (mb - sqrt_d) * recip_a;
  let t2 = (mb + sqrt_d) * recip_a;
  let t = select(t2, t1, t1 > 0.);
  if t <= 0.0 {
    return false;
  }

  return true;
}

fn sky_color(ray: Ray) -> vec4f
{
  let t = 0.5 * (ray.direction.y + 1.0);
  return (1.0 - t) * vec4f(0.0, 0.3, 0.4, 1.0) + t * vec4f(0.0, 0.01, 0.1, 1.0);
}