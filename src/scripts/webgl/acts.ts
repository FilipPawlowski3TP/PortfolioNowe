// Act mapping: one continuous scroll drives the scene (masterprompt sekcja 11.1).
// PATCH v1.1: sky grade follows the storyboard table (hero 0.0 -> kontakt 1.0).

export interface SceneState {
  progress: number; // 0..1 across the whole page
  act: number; // 1..7 (hero..contact)
  grade: number; // 0..1 night -> dawn (matches uGrade)
  pointer: { x: number; y: number }; // -1..1, pointer: fine only
}

export function createSceneState(): SceneState {
  return { progress: 0, act: 1, grade: 0, pointer: { x: 0, y: 0 } };
}

// Act boundaries follow the storyboard (sekcja 9): I hero, II oferta,
// III proces, IV realizacje, V standard, VI faq, VII kontakt.
const ACT_STOPS = [0, 0.16, 0.36, 0.52, 0.68, 0.82, 0.92, 1];

// PATCH v1.1 §2 sky column: hero 0.0, oferta 0.2, proces 0.4 -> 0.6,
// realizacje 0.75, standard/faq 0.85, kontakt 1.0.
const GRADE_STOPS: Array<[number, number]> = [
  [0, 0],
  [0.16, 0.2],
  [0.36, 0.4],
  [0.52, 0.6],
  [0.68, 0.75],
  [0.82, 0.85],
  [0.92, 0.85],
  [1, 1],
];

function gradeAt(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 1; i < GRADE_STOPS.length; i++) {
    const [x1, y1] = GRADE_STOPS[i];
    if (p <= x1) {
      const [x0, y0] = GRADE_STOPS[i - 1];
      const t = (p - x0) / Math.max(1e-5, x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return 1;
}

export function updateAct(state: SceneState): void {
  let act = 1;
  for (let i = 1; i < ACT_STOPS.length; i++) {
    if (state.progress >= ACT_STOPS[i - 1]) act = i;
  }
  state.act = act;
  state.grade = gradeAt(state.progress);
}
