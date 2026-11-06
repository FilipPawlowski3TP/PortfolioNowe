// Dust particles ("pył"): slow upward drift wrapped in a 14-unit column,
// subtle pointer parallax. GLSL ES 3.00.
uniform float uTime;
uniform vec2 uPointer;
uniform float uPixelRatio;
uniform float uProgress;

out float vFade;

void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * 0.12, 14.0) - 4.0;
  p.x += uPointer.x * 0.8 * (0.4 + 0.6 * (p.z + 8.0) / 16.0);
  p.y += uPointer.y * 0.4;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((200.0 * uPixelRatio) / -mv.z, 2.0, 7.0 * uPixelRatio);

  vFade = 0.35 + 0.4 * smoothstep(-4.0, 3.0, p.y);
}
