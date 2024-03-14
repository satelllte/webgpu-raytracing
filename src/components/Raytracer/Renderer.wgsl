@group(0) @binding(0) var<uniform> dimensions: Dimensions;
@group(0) @binding(1) var<storage> materials: array<Material>;
@group(0) @binding(2) var<storage> spheres: array<Sphere>;

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

struct Dimensions { width: f32, height: f32 }
struct Material { color: ColorRGB }
struct Sphere { center: vec3f, radius: f32, material_index: f32 }
struct Ray { origin: vec3f, direction: vec3f /* normalized unit-vector */ }
struct RayHit { position: vec3f, normal: vec3f, t: f32 /* no hit when less than 0 */ }
struct Light { position: vec3f }

const light = Light(/* position */vec3f(1.0, 5.0, -2.0));

fn color_spheres(camera_ray: Ray) -> ColorRGB
{
  let spheres_count = arrayLength(&spheres);
  for (var i: u32 = 0; i < spheres_count; i++) {
    let sphere = spheres[i];
    let hit = hit_sphere(sphere, camera_ray);
    if (hit.t <= 0.0) { continue; }

    let light_direction = normalize(light.position - hit.position);
    let color_min = ColorRGB(0.0);
    let color_max = materials[u32(sphere.material_index)].color;
    return lerp(color_min, color_max, dot(light_direction, hit.normal));
  }
  return color_sky(camera_ray);
}

fn color_sky(ray: Ray) -> ColorRGB
{
  return lerp(ColorRGB(0.0, 0.3, 0.4), ColorRGB(0.0, 0.01, 0.1), 0.5 * (ray.direction.y + 1.0));
}

fn hit_sphere(sphere: Sphere, ray: Ray) -> RayHit
{
  let v = ray.origin - sphere.center;
  let a = dot(ray.direction, ray.direction);
  let b = dot(v, ray.direction);
  let c = dot(v, v) - sphere.radius * sphere.radius;
  let d = b * b - a * c;
  if (d < 0.0) { return no_hit(); }

  let sqrt_d = sqrt(d);
  let recip_a = 1.0 / a;
  let t1 = (-b - sqrt_d) * recip_a;
  let t2 = (-b + sqrt_d) * recip_a;
  let t = select(t2, t1, t1 > 0.0);
  if (t <= 0.0) { return no_hit(); }

  let position = ray_position(ray, t);
  let normal = normalize((position - sphere.center) / sphere.radius);
  return RayHit(position, normal, t);
}

fn no_hit() -> RayHit
{
  return RayHit(/* position */vec3f(0.0), /* normal */vec3f(0.0), /* t */-1.0);
}

fn ray_position(ray: Ray, t: f32) -> vec3f
{
  return ray.origin + t * ray.direction;
}

fn lerp(a: vec3f, b: vec3f, t: f32) -> vec3f
{
  return (1.0 - t) * a + t * b;
}
