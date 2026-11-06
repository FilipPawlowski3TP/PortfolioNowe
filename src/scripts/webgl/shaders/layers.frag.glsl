// Soft depth blobs ("głębia"): very low contrast, slow drift, warm with grade.
// uLayer (0..1) differentiates depth planes. GLSL ES 3.00.
precision highp float;

uniform float uTime;
uniform float uGrade;
uniform float uLayer;

in vec2 vUv;
out vec4 outColor;

float softBlob(vec2 uv, vec2 c, float r) {
  float d = distance(uv, c);
  return smoothstep(r, r * 0.2, d);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.05 * (0.5 + uLayer);

  float b = 0.0;
  b += softBlob(uv, vec2(0.32 + 0.06 * sin(t), 0.45 + 0.05 * cos(t * 0.8)), 0.34);
  b += softBlob(uv, vec2(0.74 + 0.05 * cos(t * 0.7), 0.58 + 0.06 * sin(t)), 0.28);
  b += softBlob(uv, vec2(0.52 + 0.07 * sin(t * 0.6), 0.25 + 0.05 * cos(t * 0.5)), 0.24);

  vec3 ice = vec3(0.32, 0.52, 0.72);
  vec3 dawn = vec3(1.0, 0.55, 0.36);
  vec3 col = mix(ice, dawn, uGrade);

  float breathe = 0.75 + 0.25 * sin(uTime * 0.12 + uLayer * 3.1);
  float alpha = b * (0.045 + 0.05 * uLayer) * breathe;

  outColor = vec4(col, alpha);
}
