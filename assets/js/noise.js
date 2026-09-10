import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.querySelector("[data-noise-canvas]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const audio = document.querySelector("[data-noise-audio]");
const audioToggle = document.querySelector("[data-audio-toggle]");
const audioLabel = document.querySelector("[data-audio-label]");

if (audio && audioToggle && audioLabel) {
  audio.volume = 0.72;
  let soundEnabled = true;

  const renderAudioState = () => {
    audioToggle.classList.toggle("is-on", soundEnabled);
    audioToggle.setAttribute("aria-pressed", String(soundEnabled));
    audioToggle.setAttribute("aria-label", soundEnabled ? "배경 음악 끄기" : "배경 음악 켜기");
    audioLabel.textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";
  };

  const playAudio = () => {
    if (!soundEnabled) return;
    audio.play().catch(() => {});
  };

  audioToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) playAudio();
    else audio.pause();
    renderAudioState();
  });

  playAudio();
  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, playAudio, { once: true, passive: eventName !== "keydown" });
  });
  renderAudioState();
}

if (canvas && !reduceMotion) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2(.5, .5) } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.);}`,
    fragmentShader: `precision highp float;varying vec2 vUv;uniform float uTime;uniform vec2 uPointer;float line(float y,float w){return smoothstep(w,0.,abs(y));}void main(){vec2 p=vUv;float d=distance(p,uPointer);float wave=sin(p.x*34.+uTime*1.7)*.012+sin(p.x*83.-uTime*2.1)*.004;float signal=line(p.y-.33-wave,.006)+line(p.y-.68+wave*.7,.003);float scan=step(.985,fract(p.y*150.+uTime*.8))*.12;float pulse=exp(-d*8.)*.18;vec3 blue=vec3(.25,.48,1.);float a=signal*.5+scan+pulse;gl_FragColor=vec4(blue,a);}`
  });
  scene.add(new THREE.Mesh(geometry, material));
  const resize = () => { const box=canvas.getBoundingClientRect(); renderer.setSize(box.width,box.height,false); };
  window.addEventListener("resize", resize); resize();
  window.addEventListener("pointermove", (event) => material.uniforms.uPointer.value.set(event.clientX/window.innerWidth,1-event.clientY/window.innerHeight), { passive: true });
  const clock = new THREE.Clock();
  const draw = () => { material.uniforms.uTime.value=clock.getElapsedTime(); renderer.render(scene,camera); requestAnimationFrame(draw); }; draw();
}
