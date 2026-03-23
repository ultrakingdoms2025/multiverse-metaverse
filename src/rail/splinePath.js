import * as THREE from 'three';
const POINTS = [
  [0, 1.7, -5], [-2, 1.7, 2], [-1, 1.7, 8], [2, 1.7, 12],
  [4, 1.7, 16], [1, 1.7, 20], [-2, 1.7, 24], [-3, 1.7, 28],
  [0, 1.7, 32], [3, 1.7, 35], [4, 1.7, 38], [1, 1.7, 42],
  [-2, 1.7, 46], [-3, 1.7, 50], [0, 1.7, 53], [2, 1.7, 56],
  [3, 1.7, 58], [1, 1.7, 60],
].map(p => new THREE.Vector3(...p));
export function createSplinePath() {
  return new THREE.CatmullRomCurve3(POINTS, false, 'catmullrom', 0.5);
}
