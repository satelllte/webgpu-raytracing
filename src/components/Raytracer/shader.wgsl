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
fn fragment_main(@builtin(position) position: vec4f) -> @location(0) ColorRGBA
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

  let rgb = trace_ray(ray, spheres);

  return ColorRGBA(rgb, 1.0);
}

alias ColorRGB = vec3f;
alias ColorRGBA = vec4f;

struct Ray {
  origin: vec3f,
  direction: vec3f, // must be normalized
}

struct Material {
  diffuse_color: ColorRGB,
}

struct Sphere {
  center: vec3f,
  radius: f32,
  material: Material,
}

const material_red = Material(ColorRGB(0.7, 0.1, 0.2));

const spheres_count = 2;
const spheres = array<Sphere, spheres_count>(
  Sphere(/* center */vec3f(0.0, 0.0, 0.0), /* radius */1.0, /* material */material_red),
  Sphere(/* center */vec3f(-4.0, 1.0, 2.0), /* radius */1.0, /* material */material_red),
);

fn trace_ray(ray: Ray, spheres: array<Sphere, spheres_count>) -> ColorRGB
{
  for (var i: i32 = 0; i < spheres_count; i++) {
    if (intersect_sphere(spheres[i], ray)) {
      return spheres[i].material.diffuse_color;
    }
  }

  return color_sky(ray);
}

fn intersect_sphere(sphere: Sphere, ray: Ray) -> bool
{
  let v = ray.origin - sphere.center;
  let a = dot(ray.direction, ray.direction);
  let b = dot(v, ray.direction);
  let c = dot(v, v) - sphere.radius * sphere.radius;
  let d = b * b - a * c;
  if (d < 0.0) { return false; }

  let sqrt_d = sqrt(d);
  let recip_a = 1.0 / a;
  let mb = -b;
  let t1 = (mb - sqrt_d) * recip_a;
  let t2 = (mb + sqrt_d) * recip_a;
  let t = select(t2, t1, t1 > 0.0);
  if (t <= 0.0) { return false; }

  return true;
}

fn color_sky(ray: Ray) -> ColorRGB
{
  let t = 0.5 * (ray.direction.y + 1.0);
  return (1.0 - t) * ColorRGB(0.0, 0.3, 0.4) + t * ColorRGB(0.0, 0.01, 0.1);
}
