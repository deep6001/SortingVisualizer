import * as THREE from 'three';

// Chess pieces from lathe profiles (radius, height). Built once and shared.
const lathe = (pts) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40);

let queen;
export function queenGeometry() {
  if (!queen)
    queen = lathe([
      [0, 0],
      [0.36, 0],
      [0.36, 0.06],
      [0.3, 0.1],
      [0.3, 0.15],
      [0.2, 0.22],
      [0.13, 0.45],
      [0.1, 0.74],
      [0.2, 0.79],
      [0.22, 0.83],
      [0.13, 0.87],
      [0.15, 0.97],
      [0.23, 1.08],
      [0.12, 1.05],
      [0, 1.04],
    ]);
  return queen;
}

let knightBase;
export function knightBaseGeometry() {
  if (!knightBase)
    knightBase = lathe([
      [0, 0],
      [0.36, 0],
      [0.36, 0.06],
      [0.3, 0.1],
      [0.3, 0.15],
      [0.22, 0.22],
      [0.2, 0.3],
      [0, 0.3],
    ]);
  return knightBase;
}
