import * as THREE from 'three';
import { state } from '../state/gameState.js';

const portalFrag = `
  uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
  void main() {
    float pulse = sin(uTime * 2.0 + vUv.y * 6.2831) * 0.5 + 0.5;
    float ring = smoothstep(0.3, 0.35, length(vUv - 0.5)) * smoothstep(0.5, 0.45, length(vUv - 0.5));
    float energy = ring * (0.5 + pulse * 0.5);
    vec3 col = uColor * energy * 1.2;
    gl_FragColor = vec4(col, energy * 0.8);
  }
`;
const portalVert = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Video portal shader — circular mask with glowing edge
const videoPortalFrag = `
  uniform sampler2D uVideo;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered);

    // Circular mask matching the torus inner radius
    float radius = 0.42;
    float edgeWidth = 0.06;

    // Discard outside circle
    if (dist > radius + edgeWidth) discard;

    // Glowing edge
    float edgeGlow = smoothstep(radius, radius - edgeWidth, dist);
    float outerGlow = smoothstep(radius + edgeWidth, radius, dist) * (1.0 - edgeGlow);

    // Video UV — map circle interior to video
    vec2 videoUv = (centered / radius) * 0.5 + 0.5;
    vec3 video = texture2D(uVideo, videoUv).rgb;

    // Add subtle distortion for otherworldly feel
    float ripple = sin(dist * 20.0 - uTime * 2.0) * 0.02;
    vec2 distortedUv = (centered / radius) * (0.5 + ripple) + 0.5;
    video = texture2D(uVideo, distortedUv).rgb;

    // Invert video colors for otherworldly look
    video = vec3(1.0) - video;
    // Darken to reduce brightness
    video *= 0.5;
    // Tint the video slightly with portal color
    video = mix(video, uColor, 0.15);

    // Combine: video inside, glow at edge
    vec3 glow = uColor * 2.0 * outerGlow;
    vec3 finalColor = video * edgeGlow + glow;
    float alpha = max(edgeGlow, outerGlow * 0.8);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const PORTAL_COLORS = [
  new THREE.Color(0x00ffff), new THREE.Color(0xffaa00),
  new THREE.Color(0xff0044), new THREE.Color(0x4488ff), new THREE.Color(0xaa00ff),
  new THREE.Color(0x00ffaa),
];

function createPortalVideo(src) {
  const video = document.createElement('video');
  video.src = src || '/overlay.mp4';
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.play().catch(() => {
    const playOnce = () => { video.play(); window.removeEventListener('click', playOnce); };
    window.addEventListener('click', playOnce);
  });
  return video;
}

export function createPortals(scene, spline) {
  const portals = [];
  const timeUniform = { value: 0 };
  const portalTValues = [0.09, 0.22, 0.40, 0.55, 0.70, 0.83];

  // Each portal gets its own video element and texture for future customization
  const portalVideoSources = ['/overlay.mp4', '/broker.mp4', '/warden.mp4', '/navigator.mp4', '/overlay.mp4', '/overlay.mp4'];
  const portalVideos = portalTValues.map((_, i) => createPortalVideo(portalVideoSources[i]));
  const videoTextures = portalVideos.map(video => {
    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });

  portalTValues.forEach((t, i) => {
    const pos = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.12, 16, 48),
      new THREE.MeshStandardMaterial({
        color: PORTAL_COLORS[i], emissive: PORTAL_COLORS[i],
        emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.2,
      })
    );
    torus.position.copy(pos); torus.position.y = 6;
    // Offset portal 2 (red/Warden) to the right side — keep clear of buildings
    if (i === 2) {
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      torus.position.add(side.multiplyScalar(1));
    }
    torus.lookAt(pos.clone().add(tangent));
    scene.add(torus);

    const fillMat = new THREE.ShaderMaterial({
      uniforms: {
        uVideo: { value: videoTextures[i] },
        uTime: timeUniform,
        uColor: { value: PORTAL_COLORS[i] },
      },
      vertexShader: portalVert,
      fragmentShader: videoPortalFrag,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), fillMat);
    fill.position.copy(torus.position); fill.quaternion.copy(torus.quaternion);
    fill.userData.portalVideo = true;
    fill.userData.portalIndex = i;
    scene.add(fill);

    const light = new THREE.PointLight(PORTAL_COLORS[i], 0.8, 15);
    light.position.copy(pos); light.position.y = 6;
    scene.add(light);

    // "Click Me" sprite for hover
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256; labelCanvas.height = 64;
    const labelCtx = labelCanvas.getContext('2d');
    labelCtx.font = 'bold 32px monospace';
    labelCtx.textAlign = 'center';
    const hexStr = '#' + PORTAL_COLORS[i].getHexString();
    labelCtx.fillStyle = hexStr;
    labelCtx.fillText('Click Me', 128, 42);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0, depthWrite: false }));
    labelSprite.position.copy(torus.position);
    labelSprite.scale.set(3, 0.75, 1);
    scene.add(labelSprite);

    portals.push({ torus, fill, light, labelSprite, hovered: false });
  });

  // All portal fills are clickable
  const clickableFills = portals.map(p => p.fill);

  function update(time) {
    timeUniform.value = time;
    portals.forEach((p, i) => {
      // Slow spin around the portal's forward axis
      if (!state.reducedMotion) {
        const speed = 0.3 + i * 0.05;
        p.torus.rotateZ(speed * 0.016);
        p.fill.rotateZ(speed * 0.016);
      }

      // Fade "Click Me" label on hover
      const targetOpacity = p.hovered ? 1.0 : 0.0;
      const cur = p.labelSprite.material.opacity;
      p.labelSprite.material.opacity += (targetOpacity - cur) * 0.1;
    });
  }

  function setHovered(index) {
    portals.forEach((p, i) => { p.hovered = i === index; });
  }

  function setSyncPulse(enabled) { /* Future: sync all portal pulse phases */ }
  return { portals, clickableFills, update, setHovered, setSyncPulse };
}
