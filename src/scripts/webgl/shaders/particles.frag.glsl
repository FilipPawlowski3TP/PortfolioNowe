// Soft round dust points. GLSL ES 3.00.
precision highp float;

uniform float uGrade;

in float vFade;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.12, d) * vFade;

  vec3 night = vec3(0.561, 0.827, 1.0);
  vec3 dawn = vec3(1.0, 0.541, 0.357);
  vec3 tint = mix(night, dawn, uGrade * 0.5);

  outColor = vec4(tint, a * 0.5);
}
