// Blueprint grid fragment: anti-aliased world-space lines, night -> dawn grade.
precision highp float;

uniform float uTime;
uniform float uProgress;
uniform float uGrade;
uniform vec2 uPointer;
uniform vec2 uRes;

in vec2 vWorld;
out vec4 outColor;

// Anti-aliased grid line using screen-space derivatives (GLSL ES 3.00).
float gridLine(vec2 p, float scale) {
  vec2 c = p / scale;
  vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
  return 1.0 - min(min(g.x, g.y), 1.0);
}

void main() {
  // Pointer nudges the horizon slightly (parallax without moving the camera).
  vec2 p = vWorld + uPointer * 2.0;

  float minor = gridLine(p, 1.0) * 0.30;
  float major = gridLine(p, 5.0) * 0.75;

  float dist = length(p) / 70.0;
  float fade = 1.0 - smoothstep(0.10, 1.0, dist);

  vec3 night = vec3(0.561, 0.827, 1.0); // --c-ice-300
  vec3 dawn = vec3(1.0, 0.541, 0.357);  // --c-dawn-400
  vec3 tint = mix(night, dawn, uGrade);

  float breathe = 0.92 + 0.08 * sin(uTime * 0.25);
  float alpha = (minor + major) * fade * breathe;

  outColor = vec4(tint, alpha * 0.55);
}
