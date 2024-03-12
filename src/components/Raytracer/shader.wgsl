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
  let camera_origin = vec3f(0.0, 0.0, 0.0);
  let ray = Ray(
    /* origin */camera_origin,
    /* direction */normalize(vec3f(
      uv,
      // (2.0 * (uv.x + 0.5) / width  - 1.0) * tan(camera_field_of_view_radians * 0.5) * aspect_ratio,
      // (2.0 * (uv.y + 0.5) / height - 1.0) * tan(camera_field_of_view_radians * 0.5),
      -camera_focus_distance, // camera is looking into -z direction following a common right-handed coordinate system convention
    )),
  );

  let rgb = trace_ray(ray, lights, spheres);

  return ColorRGBA(rgb, 1.0);
}

alias ColorRGB = vec3f;
alias ColorRGBA = vec4f;

struct Ray {
  origin: vec3f,
  direction: vec3f, // must be normalized
}

struct RayHit {
  position: vec3f,
  normal: vec3f,
  t: f32, // no hit when less than 0
}

struct Material {
  diffuse_color: ColorRGB,
  albedo: vec2f,
  specular_exponent: f32,
}

struct Light {
  position: vec3f,
  intensity: f32,
}

struct Sphere {
  center: vec3f,
  radius: f32,
  material: Material,
}

struct SphereHit {
  index: i32,
  hit: RayHit,
}

const material_red = Material(/* diffuse_color */ColorRGB(0.7, 0.1, 0.2), /* albedo */vec2f(1.0, 0.7), /* specular_exponent */50.0);
const material_blue = Material(/* diffuse_color */ColorRGB(0.2, 0.1, 0.8), /* albedo */vec2f(1.0, 0.2), /* specular_exponent */10.0);
const material_pink = Material(/* diffuse_color */ColorRGB(0.9, 0.3, 0.8), /* albedo */vec2f(1.0, 0.9), /* specular_exponent */20.0);

const lights_count = 2;
const lights = array<Light, lights_count>(
  Light(/* position */vec3f(4.0, 2.0, -3.0), /* intensity */1.0),
  Light(/* position */vec3f(4.0, -2.0, 3.0), /* intensity */0.22),
);

const spheres_count = 4;
const spheres = array<Sphere, spheres_count>(
  Sphere(/* center */vec3f(0.0, 0.0, -6.0), /* radius */1.0, /* material */material_red),
  Sphere(/* center */vec3f(-1.25, 0.4, -4.0), /* radius */1.0, /* material */material_red),
  Sphere(/* center */vec3f(-3.0, 2.0, -5.0), /* radius */2.0, /* material */material_blue),
  Sphere(/* center */vec3f(3.0, 2.0, -5.0), /* radius */0.5, /* material */material_pink),
);

fn trace_ray(
  ray: Ray,
  lights: array<Light, lights_count>,
  spheres: array<Sphere, spheres_count>,
) -> ColorRGB
{
  let sphere_hit = hit_spheres(spheres, ray);
  if (sphere_hit.index < 0) {
    return color_sky(ray);
  }

  let sphere = spheres[sphere_hit.index];
  let hit = sphere_hit.hit;
  let material = sphere.material;
  var diffuse_light_intensity: f32 = 0.0;
  var specular_light_intensity: f32 = 0.0;
  for (var i: i32 = 0; i < lights_count; i++) {
    let light = lights[i];
    let light_direction = normalize(light.position - hit.position);
    diffuse_light_intensity += light.intensity * max(0.0, dot(light_direction, hit.normal));
    specular_light_intensity += pow(max(0.0, dot(reflect(light_direction, hit.normal), ray.direction)), material.specular_exponent) * light.intensity;
  }
  return material.diffuse_color * diffuse_light_intensity * material.albedo[0] + vec3f(1.0) * specular_light_intensity * material.albedo[1];
}

fn hit_spheres(spheres: array<Sphere, spheres_count>, ray: Ray) -> SphereHit
{
  var sphere_hit = SphereHit(/* index */-1, /* hit */no_hit());

  for (var i: i32 = 0; i < spheres_count; i++) {
    let sphere = spheres[i];
    let hit = hit_sphere(sphere, ray);
    if (hit.t > 0.0 && (hit.t < sphere_hit.hit.t || sphere_hit.index < 0)) {
      sphere_hit = SphereHit(i, hit);
    }
  }

  return sphere_hit;
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
  let mb = -b;
  let t1 = (mb - sqrt_d) * recip_a;
  let t2 = (mb + sqrt_d) * recip_a;
  let t = select(t2, t1, t1 > 0.0);
  if (t <= 0.0) { return no_hit(); }

  let position = ray_position(ray, t);
  let normal = normalize((position - sphere.center) / sphere.radius);
  return RayHit(position, normal, t);
}

fn no_hit() -> RayHit {
  return RayHit(/* position */vec3f(0.0), /* normal */vec3f(0.0), /* t */-1.0);
}

fn ray_position(ray: Ray, t: f32) -> vec3f {
  return ray.origin + t * ray.direction;
}

fn color_sky(ray: Ray) -> ColorRGB
{
  let t = 0.5 * (ray.direction.y + 1.0);
  return (1.0 - t) * ColorRGB(0.0, 0.3, 0.4) + t * ColorRGB(0.0, 0.01, 0.1);
}
