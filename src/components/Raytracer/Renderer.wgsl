@group(0) @binding(0) var<uniform> dimensions: Dimensions;
@group(0) @binding(1) var<storage> spheres: array<Sphere>;

@vertex
fn vertex_main(@location(0) position: vec4f) -> @builtin(position) vec4f
{
  return position;
}

@fragment
fn fragment_main(@builtin(position) position: vec4f) -> @location(0) ColorRGBA
{
  let width = dimensions.width;
  let height = dimensions.height;
  let aspect_ratio = width / height;
  var uv = position.xy / vec2f(width, height);
  uv = (2.0 * uv - vec2f(1.0)) * vec2f(aspect_ratio, -1.0); // mapping `uv` from y-down (normalized) viewport coordinates to camera coordinates
  let camera_focus_distance = 1.0;
  let camera_origin = vec3f(0.0, 0.0, 0.0);
  let camera_ray = Ray(
    /* origin */camera_origin,
    /* direction */normalize(vec3f(
      uv,
      -camera_focus_distance, // camera is looking into -z direction following a common right-handed coordinate system convention
    )),
  );
  return ColorRGBA(color_spheres(camera_ray), 1.0);
}

alias ColorRGB = vec3f;
alias ColorRGBA = vec4f;

struct Dimensions {
  width: f32,
  height: f32,
}

struct Sphere {
  center: vec3f,
  radius: f32,
}

struct Ray {
  origin: vec3f,
  direction: vec3f, // must be normalized unit-vector
}

fn color_spheres(camera_ray: Ray) -> ColorRGB
{
  let spheres_count = arrayLength(&spheres);
  for (var i: u32 = 0; i < spheres_count; i++) {
    let sphere = spheres[i];
    if (hit_sphere(sphere, camera_ray)) {
      return color_sphere();
    }
  }
  return color_sky(camera_ray);
}

fn color_sphere() -> ColorRGB
{
  return ColorRGB(0.8, 0.5, 0.8);
}

fn color_sky(ray: Ray) -> ColorRGB
{
  let t = 0.5 * (ray.direction.y + 1.0);
  return (1.0 - t) * ColorRGB(0.0, 0.3, 0.4) + t * ColorRGB(0.0, 0.01, 0.1);
}

fn hit_sphere(sphere: Sphere, ray: Ray) -> bool
{
  let v = ray.origin - sphere.center;
  let a = dot(ray.direction, ray.direction);
  let b = dot(v, ray.direction);
  let c = dot(v, v) - sphere.radius * sphere.radius;
  let d = b * b - a * c;
  if (d < 0.0) { return false; }

  let sqrt_d = sqrt(d);
  let recip_a = 1.0 / a;
  let t1 = (-b - sqrt_d) * recip_a;
  let t2 = (-b + sqrt_d) * recip_a;
  let t = select(t2, t1, t1 > 0.0);
  if (t <= 0.0) { return false; }

  return true;
}
