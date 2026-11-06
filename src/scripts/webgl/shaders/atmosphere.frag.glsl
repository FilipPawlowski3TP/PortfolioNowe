// Cinematic atmosphere: night ambience with a warm dawn glow that rises and
// intensifies with uGrade (scroll). Soft, filmic — no technical patterns.
// GLSL ES 3.00.
precision highp float;

uniform float uTime;
uniform float uProgress;
uniform float uGrade;
uniform vec2 uPointer;
uniform vec2 uRes;

in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // Night ambience: deep navy, slightly lighter towards the horizon
  vec3 top = vec3(0.027, 0.043, 0.094);    // night-950
  vec3 bottom = vec3(0.051, 0.082, 0.165); // night-900 lifted
  vec3 col = mix(bottom, top, smoothstep(0.0, 1.0, uv.y));

  // Dawn glow: rises from below the horizon as the user scrolls
  float aspect = uRes.x / max(1.0, uRes.y);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
  vec2 glowCenter = vec2(uPointer.x * 0.05, -0.12 + uGrade * 0.5);
  float d = distance(p, glowCenter);
  float glow = exp(-d * d * 2.2) * (0.22 + 0.75 * uGrade);

  vec3 dawn = vec3(1.0, 0.541, 0.357);   // dawn-400
  vec3 ice = vec3(0.561, 0.827, 1.0);    // ice-300
  vec3 glowCol = mix(ice * 0.35, dawn, smoothstep(0.0, 0.45, uGrade));
  col += glowCol * glow;

  // Secondary cool light on the opposite side (depth balance)
  float d2 = distance(p, vec2(aspect * 0.42, 0.72));
  col += ice * 0.06 * exp(-d2 * d2 * 2.0) * (1.0 - uGrade * 0.6);

  // Slow breathing + dither (prevents gradient banding)
  col *= 0.985 + 0.015 * sin(uTime * 0.18);
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * (2.0 / 255.0);

  outColor = vec4(col, 1.0);
}
