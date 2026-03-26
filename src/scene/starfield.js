import * as THREE from 'three';

export function createStarfield(scene) {
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const twinkleOffsets = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    // Distribute stars in a large sphere around the scene
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 150 + Math.random() * 200;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 10; // Keep above horizon
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    // Subtle color variation — mostly white/blue with occasional warm stars
    const colorRand = Math.random();
    if (colorRand < 0.6) {
      // White/blue
      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      colors[i * 3 + 2] = 1.0;
    } else if (colorRand < 0.8) {
      // Warm yellow
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.2;
    } else {
      // Cyan/teal accent
      colors[i * 3] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 1.0;
    }

    sizes[i] = 0.3 + Math.random() * 1.2;
    twinkleOffsets[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      varying float vSize;
      uniform float uTime;
      void main() {
        vColor = color;
        vSize = size;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vSize;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        glow = pow(glow, 2.0);
        gl_FragColor = vec4(vColor * glow, glow * 0.9);
      }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  scene.add(stars);

  // Nebula clouds — large transparent sprites
  const nebulaGroup = new THREE.Group();
  const nebulaColors = [
    new THREE.Color(0x1a0033),
    new THREE.Color(0x0a1a33),
    new THREE.Color(0x1a0a22),
    new THREE.Color(0x0a0a33),
  ];

  for (let i = 0; i < 8; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const col = nebulaColors[i % nebulaColors.length];
    gradient.addColorStop(0, `rgba(${Math.floor(col.r*255)},${Math.floor(col.g*255)},${Math.floor(col.b*255)},0.15)`);
    gradient.addColorStop(0.4, `rgba(${Math.floor(col.r*255)},${Math.floor(col.g*255)},${Math.floor(col.b*255)},0.06)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));

    const angle = (i / 8) * Math.PI * 2;
    const r = 100 + Math.random() * 100;
    sprite.position.set(
      Math.cos(angle) * r,
      30 + Math.random() * 60,
      Math.sin(angle) * r
    );
    sprite.scale.set(80 + Math.random() * 60, 40 + Math.random() * 40, 1);
    nebulaGroup.add(sprite);
  }
  scene.add(nebulaGroup);

  function update(time) {
    material.uniforms.uTime.value = time;
    // Gentle star field rotation
    stars.rotation.y = time * 0.005;
    nebulaGroup.rotation.y = time * 0.003;
  }

  return { update };
}
