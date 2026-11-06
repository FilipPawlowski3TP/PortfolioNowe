// Blueprint grid, ground plane. GLSL ES 3.00 (three.js GLSL3: auto-declared
// position/modelMatrix/projectionMatrix/modelViewMatrix — do not redeclare).
out vec2 vWorld;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
