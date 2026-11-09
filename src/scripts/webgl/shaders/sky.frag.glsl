// Sky — domain-warped fbm, night -> dawn palette (PATCH v1.1 §3).
// uGrade: 0 deep night (stars) -> 1 full warm dawn. No postprocessing: glow is
// in-shader. Dither kills gradient banding.
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uGrade;
uniform float uScroll;
uniform vec2 uPointer;
uniform vec2 uRes;
uniform float uOctaves;
uniform float uWarp; // 1 = organic domain-warped clouds (tier 2), 0 = cheap path

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  v += amp * noise(p);
  if (uOctaves > 1.5) {
    p = p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
    v += amp * noise(p);
  }
  if (uOctaves > 2.5) {
    p = p * 2.01 + vec2(8.3, 2.8);
    amp *= 0.5;
    v += amp * noise(p);
  }
  return v;
}

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  float y = vUv.y; // 0 bottom -> 1 top

  // Slow living sky: domain warp drifts with time and scroll. The warp costs
  // two extra fbm calls — skipped on the cheap path (low tiers).
  float t = uTime * 0.012 + uScroll * 0.6;
  vec2 q = vec2(0.0);
  if (uWarp > 0.5) {
    q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 + vec2(3.1, 1.7) - t * 0.8));
  }
  float f = fbm(p * 1.9 + q * (0.9 + 0.5 * uGrade));

  // Palettes: deep navy/indigo night -> violet -> amber/peach dawn.
  vec3 nightTop = vec3(0.031, 0.039, 0.094);
  vec3 nightMid = vec3(0.075, 0.082, 0.176);
  vec3 nightLow = vec3(0.118, 0.102, 0.235);
  vec3 dawnTop = vec3(0.165, 0.118, 0.278);
  vec3 dawnMid = vec3(0.545, 0.298, 0.365);
  vec3 dawnLow = vec3(1.0, 0.62, 0.42);
  vec3 warm = vec3(1.0, 0.82, 0.62);

  float w = y + (f - 0.5) * 0.42;
  vec3 night = mix(nightLow, nightTop, smoothstep(0.0, 1.0, w));
  night = mix(night, nightMid, 0.32);
  vec3 dawn = mix(dawnLow, dawnTop, smoothstep(0.0, 1.0, w));
  dawn = mix(dawn, dawnMid, (1.0 - y) * 0.38);

  float g = smoothstep(0.04, 0.96, uGrade);
  vec3 col = mix(night, dawn, g);

  // Horizon glow rises with grade (the "swit" is read from this).
  float glow = exp(-pow((y - 0.14) * 2.6, 2.0)) * (0.10 + 0.85 * uGrade);
  col += warm * glow * (0.35 + 0.45 * f);

  // Stars: deep night only, soft round points (not grid squares).
  vec2 sp = p * 150.0;
  vec2 cell = floor(sp);
  vec2 fp = fract(sp) - 0.5;
  float rnd = hash(cell);
  float starShape = smoothstep(0.32, 0.0, length(fp)) * step(0.992, rnd);
  float stars = starShape * (1.0 - smoothstep(0.12, 0.45, uGrade));
  float twinkle = 0.55 + 0.45 * sin(uTime * 1.3 + rnd * 40.0);
  col += vec3(0.85, 0.9, 1.0) * stars * twinkle * 1.1;

  // Pointer: subtle warm brightening around the cursor (fine pointers).
  vec2 ptr = vec2((uPointer.x * 0.5 + 0.5) * aspect, uPointer.y * 0.5 + 0.5);
  float pd = length(p - ptr);
  col += warm * 0.05 * exp(-pd * pd * 1.2) * (0.4 + 0.6 * uGrade);

  // Dither (anti-banding).
  float d = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(col + d, 1.0);
}
