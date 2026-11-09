// Fullscreen sky quad (PATCH v1.1): one triangle pair covering NDC.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
