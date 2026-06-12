/**
 * Architecture flow animation — a Lego rendition of this sample's actual
 * composition, built from the "In this sample" component list in the DOM.
 *
 * Three.js renders the stack (Baseplate → Studs → Bricks → Tiles); GSAP plays
 * the transaction path when the payment runs: the tile lights up first (card
 * capture), then the stud (tokenization), then each brick (SDK operation),
 * mirroring what the app is really doing. Brand palette only, no gradients.
 */
import * as THREE from 'three';

const COLORS = {
  globalBlue: 0x262aff,
  deepBlue: 0x1b1ec6,
  pulseBlue: 0x1cabff,
  creamsicle: 0xfda052,
  raspberry: 0xf4364c,
  white: 0xffffff,
  fog: 0xeeeeee,
};

const LAYER_STYLE = {
  stud: { color: COLORS.pulseBlue, w: 1.1, d: 1.1, h: 0.5, studs: [1, 1] },
  brick: { color: COLORS.globalBlue, w: 2.4, d: 1.3, h: 0.62, studs: [4, 2] },
  tile: { color: COLORS.creamsicle, w: 2.4, d: 1.3, h: 0.26, studs: [0, 0] },
};

const debug = { ready: false, phases: [], pulses: [] };
window.__gpFlow = debug;

function waitForGsap() {
  return new Promise((resolve) => {
    (function poll() {
      if (window.gsap) return resolve(window.gsap);
      setTimeout(poll, 40);
    })();
  });
}

function readComponents() {
  return [...document.querySelectorAll('.gp-chips .gp-chip')].map((el) => ({
    el,
    name: el.querySelector('.gp-chip-name').textContent.trim(),
    layer: el.querySelector('.gp-chip-layer').textContent.trim().toLowerCase(),
  }));
}

function legoPiece({ color, w, d, h, studs, label }) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.05,
    emissive: color,
    emissiveIntensity: 0,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  body.position.y = h / 2;
  body.castShadow = true;
  group.add(body);

  // Bake text directly onto the front and back (long) faces as flush planes.
  if (label) {
    const cw = 512;
    const ch = Math.max(32, Math.round(512 * h / w));
    const tc = document.createElement('canvas');
    tc.width = cw;
    tc.height = ch;
    const ctx = tc.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(10, Math.min(ch * 0.52, cw / (label.length * 0.62)));
    ctx.font = `bold ${Math.round(fontSize)}px DM Sans, Noto Sans, sans-serif`;
    ctx.fillText(label, cw / 2, ch / 2);
    const tex = new THREE.CanvasTexture(tc);
    const faceMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.82), faceMat);
    front.position.set(0, h / 2, d / 2 + 0.003);
    group.add(front);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.82), faceMat);
    back.position.set(0, h / 2, -(d / 2 + 0.003));
    back.rotation.y = Math.PI;
    group.add(back);
  }

  const [nx, nz] = studs;
  if (nx > 0 && nz > 0) {
    const studGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.16, 24);
    for (let i = 0; i < nx; i += 1) {
      for (let j = 0; j < nz; j += 1) {
        const stud = new THREE.Mesh(studGeo, material);
        stud.position.set(
          -w / 2 + (w / nx) * (i + 0.5),
          h + 0.08,
          -d / 2 + (d / nz) * (j + 0.5)
        );
        stud.castShadow = true;
        group.add(stud);
      }
    }
  }
  group.userData.material = material;
  group.userData.height = h + (nx > 0 ? 0.16 : 0);
  group.userData.bodyHeight = h; // body-only height used for interlocking stacking
  return group;
}

// DOM-only fallback: when WebGL is unavailable the chips still trace the flow.
function chipFallback(gsap, components) {
  const canvas = document.getElementById('gp-flow-canvas');
  if (canvas) canvas.hidden = true;
  document.addEventListener('gp:flow', (event) => {
    const phase = event.detail && event.detail.phase;
    debug.phases.push(phase);
    if (phase !== 'pay' && phase !== 'capture') return;
    const order = components.filter((c) =>
      phase === 'capture' ? /capture/i.test(c.name) : !/capture/i.test(c.name)
    );
    const captionEl = document.getElementById('gp-flow-caption');
    order.forEach((component, i) => {
      debug.pulses.push(component.name);
      setTimeout(() => {
        component.el.classList.add('gp-chip--active');
        if (captionEl) {
          captionEl.innerHTML = `<strong>Step ${i + 1} of ${order.length}</strong> · ${component.name} is handling the payment.`;
          (debug.captions = debug.captions || []).push(captionEl.textContent);
        }
      }, i * 450);
      setTimeout(() => component.el.classList.remove('gp-chip--active'), i * 450 + 750);
    });
  });
  debug.webgl = false;
  debug.ready = true;
}

async function init() {
  const canvas = document.getElementById('gp-flow-canvas');
  const components = readComponents();
  if (!canvas || components.length === 0) return;

  const gsap = await waitForGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const width = canvas.clientWidth || canvas.parentElement.clientWidth;
  const height = 220;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    chipFallback(gsap, components);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
  camera.position.set(5.2, 3.6, 6.2);
  camera.lookAt(-0.4, 1.2, 0);

  scene.add(new THREE.AmbientLight(COLORS.white, 0.85));
  const key = new THREE.DirectionalLight(COLORS.white, 1.6);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  scene.add(key);
  const fill = new THREE.DirectionalLight(COLORS.pulseBlue, 0.25);
  fill.position.set(-4, 3, -3);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.ShadowMaterial({ opacity: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const stack = new THREE.Group();
  scene.add(stack);

  // Wider baseplate to accommodate the side-by-side stud layout.
  const baseplate = legoPiece({ color: COLORS.deepBlue, w: 5.6, d: 2.4, h: 0.3, studs: [8, 3], label: 'Global Payments' });
  baseplate.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
  stack.add(baseplate);

  // Studs sit on the baseplate to the left; bricks/tiles stack on the right.
  // Use bodyHeight (not height) so each brick's studs slot into the underside
  // of the brick above, just like real LEGO.
  const baseplateTop = baseplate.userData.bodyHeight;
  let stackY = baseplateTop;
  let studX = -1.9;
  let stackBrickIndex = 0;

  const pieces = components.map((component) => {
    const style = LAYER_STYLE[component.layer] || LAYER_STYLE.brick;
    const brickLabel = component.name.replace(/\s*helper\s*/i, '');
    const piece = legoPiece({
      ...style,
      color: component.layer === 'brick' && stackBrickIndex % 2 === 1 ? COLORS.deepBlue : style.color,
      label: brickLabel,
    });
    piece.userData.component = component;

    if (component.layer === 'stud') {
      // Place studs on the baseplate beside the brick stack.
      piece.position.set(studX, baseplateTop, 0);
      studX += style.w + 0.15;
    } else {
      // Stack bricks and tiles vertically on the right side.
      piece.position.set(0.6, stackY, 0);
      stackY += piece.userData.bodyHeight;
      stackBrickIndex += 1;
    }

    stack.add(piece);
    return piece;
  });

  let rendering = true;
  function renderLoop() {
    if (rendering) renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  }
  renderLoop();
  document.addEventListener('visibilitychange', () => {
    rendering = document.visibilityState === 'visible';
  });

  // Entry: pieces drop and snap into place.
  if (!reduceMotion) {
    pieces.forEach((piece, i) => {
      const finalY = piece.position.y;
      piece.position.y = finalY + 3.2;
      gsap.to(piece.position, {
        y: finalY,
        duration: 0.7,
        delay: 0.25 + i * 0.14,
        ease: 'bounce.out',
      });
    });
    gsap.to(stack.rotation, { y: Math.PI * 2, duration: 36, repeat: -1, ease: 'none' });
    gsap.to(stack.position, { y: 0.06, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  // --- narrative ------------------------------------------------------------
  // Each step explains what the component is doing for THIS payment, so the
  // animation reads as the transaction's actual journey, not decoration.
  const IDLE_CAPTION = "This stack is the sample's real architecture — one piece per component.";
  const captionEl = document.getElementById('gp-flow-caption');

  function describe(component) {
    const name = component.name;
    if (component.layer === 'tile') return 'collects the card in iframes hosted by Global Payments';
    if (component.layer === 'stud') return 'swaps the raw card data for a single-use token';
    if (/^charge/i.test(name)) return 'sends the token to the GP API and takes the payment in one step';
    if (/^authorize/i.test(name)) return 'asks the GP API to hold the funds without taking them';
    if (/capture/i.test(name)) return 'tells the GP API to settle the funds held by Authorize';
    return 'runs its SDK operation against the GP API';
  }

  function setCaption(html) {
    if (!captionEl) return;
    captionEl.innerHTML = html;
    debug.captions = debug.captions || [];
    debug.captions.push(captionEl.textContent);
  }

  // The token — a Sunshine spark representing the payment data — physically
  // travels the request path: tile (card capture) → stud (tokenization) →
  // brick(s) (SDK operations), gliding in front of the stack between stops.
  const tokenMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.sunshine || 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const token = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), tokenMaterial);
  token.visible = false;
  stack.add(token);

  function flowPieces(phase) {
    const byLayer = (layer) => pieces.filter((p) => p.userData.component.layer === layer);
    const captureBrick = pieces.find((p) => /capture/i.test(p.userData.component.name));
    if (phase === 'capture') return captureBrick ? [captureBrick] : [];
    const bricks = byLayer('brick').filter((p) => p !== captureBrick);
    return [...byLayer('tile'), ...byLayer('stud'), ...bricks];
  }

  function pieceCenter(piece) {
    return {
      x: piece.position.x,
      y: piece.position.y + piece.userData.height / 2,
    };
  }

  function pulse(piece, tl, at) {
    const { material } = piece.userData;
    const chip = piece.userData.component.el;
    debug.pulses.push(piece.userData.component.name);
    tl.add(() => chip.classList.add('gp-chip--active'), at);
    tl.to(piece.scale, { x: 1.14, y: 1.18, z: 1.14, duration: 0.22, ease: 'power2.out' }, at);
    tl.to(material, { emissiveIntensity: 0.55, duration: 0.22, ease: 'power2.out' }, at);
    tl.to(piece.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }, at + 0.24);
    tl.to(material, { emissiveIntensity: 0, duration: 0.5, ease: 'power2.inOut' }, at + 0.3);
    tl.add(() => chip.classList.remove('gp-chip--active'), at + 0.9);
  }

  let currentFlow = null;

  function playFlow(phase) {
    const route = flowPieces(phase);
    if (route.length === 0) return null;
    const tl = gsap.timeline();
    const STEP = 1.1;

    // token enters above the first stop
    const first = pieceCenter(route[0]);
    tl.set(token, { visible: true }, 0);
    tl.set(token.position, { x: first.x, y: first.y + 1.4, z: 1.0 }, 0);
    tl.set(token.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0);
    tl.to(token.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'back.out(2)' }, 0);

    route.forEach((piece, i) => {
      const at = 0.3 + i * STEP;
      const stop = pieceCenter(piece);
      const component = piece.userData.component;
      // glide to the next stop, slightly in front of the stack
      tl.to(token.position, { x: stop.x, y: stop.y, z: 1.0, duration: 0.45, ease: 'power2.inOut' }, at);
      // dock into the piece
      tl.to(token.position, { z: 0, duration: 0.25, ease: 'power2.in' }, at + 0.45);
      tl.add(() => setCaption(
        `<strong>Step ${i + 1} of ${route.length}</strong> · ${component.name} ${describe(component)}.`
      ), at + 0.45);
      pulse(piece, tl, at + 0.55);
      if (i < route.length - 1) {
        // re-emerge for the next leg
        tl.to(token.position, { z: 1.0, duration: 0.2, ease: 'power2.out' }, at + STEP - 0.2);
      }
    });

    // the token is consumed by the last operation
    const end = 0.3 + route.length * STEP;
    tl.to(token.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.25, ease: 'power2.in' }, end - 0.2);
    tl.set(token, { visible: false }, end);
    currentFlow = tl;
    return tl;
  }

  function playSuccess() {
    const run = () => {
      setCaption('<strong>Approved.</strong> The response travelled back up the stack — already on it.');
      const tl = gsap.timeline();
      tl.to(stack.position, { y: 0.28, duration: 0.24, ease: 'power2.out' });
      tl.to(stack.position, { y: 0, duration: 0.7, ease: 'bounce.out' });
      pieces.forEach((piece) => {
        tl.to(piece.userData.material, { emissiveIntensity: 0.45, duration: 0.18 }, 0.1);
        tl.to(piece.userData.material, { emissiveIntensity: 0, duration: 0.6 }, 0.4);
      });
      tl.add(() => setCaption(IDLE_CAPTION), 5);
    };
    if (currentFlow && currentFlow.isActive()) currentFlow.then(run);
    else run();
  }

  function playError() {
    const run = () => {
      setCaption('<strong>Declined.</strong> The stack rejected the request — check the card details and retry.');
      gsap.set(token, { visible: false });
      const tl = gsap.timeline();
      tl.to(stack.position, { x: -0.12, duration: 0.07, repeat: 5, yoyo: true, ease: 'none' });
      tl.set(stack.position, { x: 0 });
      pieces.forEach((piece) => {
        piece.userData.material.emissive.setHex(COLORS.raspberry);
        tl.to(piece.userData.material, { emissiveIntensity: 0.25, duration: 0.1 }, 0);
        tl.to(piece.userData.material, { emissiveIntensity: 0, duration: 0.5, onComplete: () => {
          piece.userData.material.emissive.setHex(piece.userData.material.color.getHex());
        } }, 0.25);
      });
      tl.add(() => setCaption(IDLE_CAPTION), 5);
    };
    if (currentFlow && currentFlow.isActive()) currentFlow.then(run);
    else run();
  }

  document.addEventListener('gp:flow', (event) => {
    const phase = event.detail && event.detail.phase;
    debug.phases.push(phase);
    if (reduceMotion) {
      // No motion: still narrate the steps so the meaning is preserved.
      if (phase === 'pay' || phase === 'capture') {
        flowPieces(phase).forEach((piece, i, all) => {
          debug.pulses.push(piece.userData.component.name);
          setCaption(`<strong>Step ${i + 1} of ${all.length}</strong> · ${piece.userData.component.name} ${describe(piece.userData.component)}.`);
        });
      } else if (phase === 'success') {
        setCaption('<strong>Approved.</strong> The response travelled back up the stack — already on it.');
      }
      return;
    }
    if (phase === 'pay') {
      setCaption('Tracing the payment through the stack…');
      playFlow('pay');
    } else if (phase === 'capture') {
      setCaption('Capturing the held funds…');
      playFlow('capture');
    } else if (phase === 'success') {
      playSuccess();
    } else if (phase === 'error') {
      playError();
    }
  });

  window.addEventListener('resize', () => {
    const w = canvas.parentElement.clientWidth;
    renderer.setSize(w, height, false);
    camera.aspect = w / height;
    camera.updateProjectionMatrix();
  });

  debug.webgl = true;
  debug.ready = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
