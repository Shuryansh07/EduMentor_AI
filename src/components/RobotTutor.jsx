import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Spinner } from './ui.jsx';

const MODEL_URL = '/models/RobotExpressive.glb';
const EMOTES = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];

/**
 * Renders the three.js RobotExpressive model and exposes an imperative API:
 *   ref.current.setExpression('Sad' | 'Angry' | 'Surprised' | 'neutral')
 *   ref.current.playEmote('Wave' | 'ThumbsUp' | ...)
 *   ref.current.setSpeaking(true|false)
 *   ref.current.react({ expression, emote })
 */
const RobotTutor = forwardRef(function RobotTutor({ className }, ref) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // three.js objects kept across renders without triggering React updates.
  const api = useRef({
    mixer: null,
    actions: {},
    activeAction: null,
    face: null,
    targetInfluences: {}, // expression name -> 0/1
    speaking: false,
    model: null,
  });

  useImperativeHandle(ref, () => ({
    setExpression(name) {
      const { face } = api.current;
      const dict = face?.morphTargetDictionary;
      if (!dict) return; // model has no facial morphs — skip safely
      const targets = {};
      Object.keys(dict).forEach((k) => {
        targets[k] = name && k.toLowerCase() === name.toLowerCase() ? 1 : 0;
      });
      api.current.targetInfluences = targets;
    },
    playEmote(name) {
      if (!EMOTES.includes(name)) return;
      fadeToAction(api.current, name, 0.2, true);
    },
    setSpeaking(on) {
      api.current.speaking = Boolean(on);
    },
    react({ expression, emote } = {}) {
      this.setExpression(expression || 'neutral');
      if (emote) this.playEmote(emote);
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let raf = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    // ── Scene ────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(-2.2, 3.2, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Lights ───────────────────────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 2.2);
    hemi.position.set(0, 20, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 2.5);
    dir.position.set(3, 10, 8);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x6a8cff, 1.2);
    rim.position.set(-6, 4, -6);
    scene.add(rim);

    // ── Controls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.target.set(0, 1.2, 0);
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.update();

    // ── Load model ───────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const actions = {};
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          actions[clip.name] = action;
          if (EMOTES.includes(clip.name) || ['Yes', 'No'].includes(clip.name)) {
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
          }
        });

        const idle = actions.Idle || Object.values(actions)[0];
        if (idle) idle.play();

        // Find the mesh that actually carries facial morph targets
        // (the node named "Head" isn't always the morph mesh).
        let face = model.getObjectByName('Head');
        if (!face?.morphTargetDictionary) {
          face = null;
          model.traverse((o) => {
            if (!face && o.morphTargetDictionary && Object.keys(o.morphTargetDictionary).length) {
              face = o;
            }
          });
        }

        api.current.mixer = mixer;
        api.current.actions = actions;
        api.current.activeAction = idle;
        api.current.face = face;
        api.current.model = model;
        if (face?.morphTargetDictionary) {
          const targets = {};
          Object.keys(face.morphTargetDictionary).forEach((k) => (targets[k] = 0));
          api.current.targetInfluences = targets;
        }

        // Return to Idle after a one-shot emote finishes.
        mixer.addEventListener('finished', () => {
          fadeToAction(api.current, 'Idle', 0.25, false);
        });

        setLoading(false);
      },
      undefined,
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Robot model failed to load', err);
        setError('Could not load the 3D model.');
        setLoading(false);
      }
    );

    // ── Animation loop ───────────────────────────────────────────────────
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const s = api.current;
      if (s.mixer) s.mixer.update(delta);

      // Smoothly lerp facial expression morph influences.
      if (s.face?.morphTargetInfluences && s.face.morphTargetDictionary) {
        const dict = s.face.morphTargetDictionary;
        Object.entries(s.targetInfluences).forEach(([name, target]) => {
          const idx = dict[name];
          if (idx === undefined) return;
          const cur = s.face.morphTargetInfluences[idx];
          s.face.morphTargetInfluences[idx] = THREE.MathUtils.lerp(cur, target, delta * 8);
        });
      }

      // Subtle "talking" head bob while speaking.
      if (s.model) {
        const target = s.speaking ? Math.sin(clock.elapsedTime * 12) * 0.06 : 0;
        s.model.rotation.x = THREE.MathUtils.lerp(s.model.rotation.x, target, delta * 6);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose?.());
        }
      });
      api.current = { mixer: null, actions: {}, activeAction: null, face: null, targetInfluences: {}, speaking: false, model: null };
    };
  }, []);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={mountRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
          <Spinner /> Loading your 3D tutor…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
});

/** Crossfade from the current action to another by name. */
function fadeToAction(state, name, duration = 0.3, restoreToIdle = false) {
  const next = state.actions[name];
  if (!next || next === state.activeAction) {
    if (restoreToIdle) {
      // already on it; just (re)play from start
      next?.reset().fadeIn(duration).play();
    }
    return;
  }
  const prev = state.activeAction;
  if (prev) prev.fadeOut(duration);
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
  state.activeAction = next;
}

export default RobotTutor;
