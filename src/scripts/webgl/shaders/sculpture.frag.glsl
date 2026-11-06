// Fresnel glow, night -> dawn grade. Additive blending. GLSL ES 3.00.
precision highp float;

uniform float uTime;
uniform float uGrade;
uniform float uOpacity;

in vec3 vNormalV;
in vec3 vViewDir;
out vec4 outColor;

void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormalV), normalize(vViewDir))), 1.8);

  vec3 ice = vec3(0.561, 0.827, 1.0);   // ice-300
  vec3 dawn = vec3(1.0, 0.541, 0.357);  // dawn-400
  vec3 col = mix(ice, dawn, uGrade);

  float pulse = 0.85 + 0.15 * sin(uTime * 0.6);
  float glow = (0.24 + fresnel * 2.1) * pulse;

  outColor = vec4(col * glow, clamp(0.10 + fresnel * 0.85, 0.0, 1.0) * uOpacity);
}
