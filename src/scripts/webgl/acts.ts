// Act mapping: one continuous scroll drives the scene (masterprompt sekcja 11.1).
// sceneState is written by scroll/pointer listeners and read (smoothed) by the
// renderer — acts describe WHAT each scroll band means for the scene.

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

export function updateAct(state: SceneState): void {
  let act = 1;
  for (let i = 1; i < ACT_STOPS.length; i++) {
    if (state.progress >= ACT_STOPS[i - 1]) act = i;
  }
  state.act = act;
  // Night -> dawn runs slightly ahead of the scroll so the contact
  // section already sits in warm light.
  state.grade = Math.min(1, Math.max(0, state.progress * 1.15));
}
