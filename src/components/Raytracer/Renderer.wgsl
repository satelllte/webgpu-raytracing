@group(0) @binding(0) var<uniform> dimensions: Dimensions;
@group(0) @binding(1) var<uniform> light: Light;
@group(0) @binding(2) var<storage> materials: array<Material>;
@group(0) @binding(3) var<storage> spheres: array<Sphere>;

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
  return ColorRGBA(color(camera_ray), 1.0);
}

alias ColorRGB = vec3f;
alias ColorRGBA = vec4f;

struct Dimensions { width: f32, height: f32 }
struct Light { position: vec3f }
struct Material { color: ColorRGB }
struct Sphere { position: vec3f, radius: f32, material_index: f32 }
struct Ray { origin: vec3f, direction: vec3f }
struct RayHit { position: vec3f, normal: vec3f, distance: f32, index: i32 }

/**
 * TODO: 
 * (1) Fix the light going through spheres and lighting up the ones that stay behind,
 * instead of having shadows on them.
 */
fn color(camera_ray: Ray) -> ColorRGB
{
  let hit = trace_ray(camera_ray);
  if (hit.distance < 0.0 || hit.index < 0) { return color_background(); }

  let sphere = spheres[hit.index];
  let light_direction = normalize(light.position - hit.position);
  let color = materials[u32(sphere.material_index)].color;
  return color * max(dot(light_direction, hit.normal), 0.0);
}

fn color_background() -> ColorRGB
{
  return ColorRGB(0.04);
}

fn trace_ray(ray: Ray) -> RayHit
{
  var closest_hit = no_hit();
  let spheres_count = i32(arrayLength(&spheres));
  for (var index: i32 = 0; index < spheres_count; index++) {
    let hit = hit_sphere(index, ray);
    if (hit.distance <= 0.0) { continue; }
    if (closest_hit.distance >= 0 && closest_hit.distance < hit.distance) { continue; }
    closest_hit = hit;
  }
  return closest_hit;
}

fn hit_sphere(index: i32, ray: Ray) -> RayHit
{
  let sphere = spheres[index];
  if (sphere.radius <= 0.0) { return no_hit(); }

  let v = ray.origin - sphere.position;
  let a = dot(ray.direction, ray.direction);
  let b = dot(v, ray.direction);
  let c = dot(v, v) - sphere.radius * sphere.radius;
  let discriminant = b * b - a * c;
  if (discriminant < 0.0) { return no_hit(); }

  let discriminant_sqrt = sqrt(discriminant);
  let t1 = (-b - discriminant_sqrt) / a;
  let t2 = (-b + discriminant_sqrt) / a;
  let distance = select(t2, t1, t1 > 0.0);
  if (distance <= 0.0) { return no_hit(); }

  let position = ray_position(ray, distance);
  let normal = normalize((position - sphere.position) / sphere.radius);
  return RayHit(position, normal, distance, index);
}

fn no_hit() -> RayHit
{
  return RayHit(/* position */vec3f(0.0), /* normal */vec3f(0.0), /* distance */-1.0, /* index */-1);
}

fn ray_position(ray: Ray, distance: f32) -> vec3f
{
  return ray.origin + distance * ray.direction;
}
