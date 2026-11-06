// Light sculpture: glowing rings + core ("Rzeźba świetlna", G2 hero concept B).
out vec3 vNormalV;
out vec3 vViewDir;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalV = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
