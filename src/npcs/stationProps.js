import * as THREE from 'three';
export function createStationProps(scene, positions) {
  const mat = (color, intensity = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
  const transMat = (color, opacity = 0.3) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.0, transparent: true, opacity, side: THREE.DoubleSide });

  // Station 0 - Architect: (blueprints removed)
  // Station 1 - Broker: (stall removed)
  // Station 2 - Warden: (gate removed)
  // Station 3 - Navigator: (ring removed)
  // Station 4 - Syndicate Boss: (platform + throne removed)
  // Station 5 - Oracle: (crystal + ring removed)
}
