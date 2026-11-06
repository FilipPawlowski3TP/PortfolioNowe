// Fullscreen atmosphere quad (screen-space, ignores camera).
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
