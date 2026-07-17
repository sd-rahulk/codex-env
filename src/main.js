import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.036);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 0, 9);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const liquidUniforms = { uTime:{value:0}, uMouse:{value:new THREE.Vector2()}, uVelocity:{value:0}, uAccent:{value:new THREE.Color('#56d8ff')} };
const liquidMaterial = new THREE.ShaderMaterial({
  uniforms: liquidUniforms,
  vertexShader: `varying vec2 vUv; varying vec3 vNormal; uniform float uTime; uniform vec2 uMouse; void main(){vUv=uv; vNormal=normal; vec3 p=position; float wave=sin(p.y*3.2+uTime*1.4)+cos(p.x*4.0-uTime); p += normal*wave*.16; p.xy += uMouse*.18*(1.0-length(uv-.5)); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `varying vec2 vUv; varying vec3 vNormal; uniform float uTime; uniform float uVelocity; uniform vec3 uAccent; void main(){vec2 p=vUv-.5; float fres=pow(1.0-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),2.6); float m=sin(18.0*length(p)-uTime*2.0)+sin((p.x+p.y)*22.0+uTime); vec3 chrome=mix(vec3(.02,.02,.026),vec3(.72,.76,.82),smoothstep(-.4,1.,m)); vec3 glow=uAccent*(fres+uVelocity*.9); gl_FragColor=vec4(chrome+glow, .88);}`,
  transparent:true
});

const heroBlob = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 64), liquidMaterial);
heroBlob.position.set(1.2, .15, 0); scene.add(heroBlob);

const glassMat = new THREE.MeshPhysicalMaterial({ color:0xbfefff, metalness:.05, roughness:.08, transmission:.75, thickness:1.2, transparent:true, opacity:.52, ior:1.45, emissive:0x173cff, emissiveIntensity:.08 });
const cubes = [];
for (let i=0;i<5;i++){ const c=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9,8,8,8), glassMat.clone()); c.position.set((i-2)*1.25, -2.2, -1.5); c.rotation.set(i*.4,i*.7,0); cubes.push(c); scene.add(c); }

const metal = new THREE.MeshStandardMaterial({ color:0xc9d1d9, metalness:.92, roughness:.18, emissive:0x080b14 });
for (let i=0;i<3;i++){ const group=new THREE.Group(); const base=new THREE.Mesh(new THREE.BoxGeometry(1.65,.08,1.05), metal); const screen=new THREE.Mesh(new THREE.BoxGeometry(1.55,.92,.05), new THREE.MeshBasicMaterial({color:[0x223cff,0x7a38ff,0x78fff1][i]})); screen.position.set(0,.5,-.48); screen.rotation.x=-.18; group.add(base,screen); group.position.set((i-1)*2.2,.1,-4-i*.3); group.rotation.y=i-.7; scene.add(group); cubes.push(group); }

const particles = new THREE.InstancedMesh(new THREE.SphereGeometry(.018,6,6), new THREE.MeshBasicMaterial({ color:0x8fefff, transparent:true, opacity:.62 }), 900);
const dummy = new THREE.Object3D();
for(let i=0;i<900;i++){ dummy.position.set((Math.random()-.5)*14,(Math.random()-.5)*10,(Math.random()-.5)*18); dummy.updateMatrix(); particles.setMatrixAt(i,dummy.matrix); }
scene.add(particles);
scene.add(new THREE.AmbientLight(0x6f7dff, .6)); const key=new THREE.DirectionalLight(0xffffff,2.1); key.position.set(-4,5,6); scene.add(key);

const rgbShift = { uniforms:{ tDiffuse:{value:null}, uVelocity:{value:0}, uTime:{value:0} }, vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}`, fragmentShader:`uniform sampler2D tDiffuse; uniform float uVelocity; uniform float uTime; varying vec2 vUv; float n(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} void main(){vec2 off=vec2(.003*uVelocity,0.); vec4 c; c.r=texture2D(tDiffuse,vUv+off).r; c.g=texture2D(tDiffuse,vUv).g; c.b=texture2D(tDiffuse,vUv-off).b; c.a=1.; c.rgb += (n(vUv+uTime)-.5)*.035; gl_FragColor=c;}` };
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), .72, .55, .18)); const shiftPass = new ShaderPass(rgbShift); composer.addPass(shiftPass);

const lenis = new Lenis({ lerp:.075, wheelMultiplier:.82 });
lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);

gsap.from('.reveal', { y:34, opacity:0, filter:'blur(18px)', scale:.98, stagger:.12, duration:1.3, ease:'power4.out' });
gsap.to(camera.position, { z:3.8, y:-.7, scrollTrigger:{ scrub:true, start:0, end:'max' } });
gsap.to(camera.rotation, { y:.28, x:-.12, scrollTrigger:{ scrub:true, start:'top top', end:'bottom bottom' } });
document.querySelectorAll('[data-count]').forEach(el=>ScrollTrigger.create({ trigger:el, once:true, start:'top 78%', onEnter:()=>gsap.to(el,{ textContent:el.dataset.count, snap:{textContent:1}, duration:2.2, ease:'power3.out' }) }));

document.querySelectorAll('.magnetic').forEach(el=>{ el.addEventListener('mousemove', e=>{ const r=el.getBoundingClientRect(), x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2; if(Math.hypot(x,y)<80) gsap.to(el,{x:x*.22,y:y*.22,duration:.55,ease:'elastic.out(0.1,0.5)'}); }); el.addEventListener('mouseleave',()=>gsap.to(el,{x:0,y:0,duration:.7,ease:'elastic.out(0.1,0.5)'})); });

document.querySelectorAll('[data-cube]').forEach(el=>el.addEventListener('mouseenter',()=>{ const c=cubes[+el.dataset.cube]; gsap.to(c.scale,{x:1.22,y:.86,z:1.22,duration:.7,ease:'elastic.out(0.7,0.35)'}); gsap.to(c.material,{emissiveIntensity:.45,duration:.4}); }));
document.querySelectorAll('[data-cube]').forEach(el=>el.addEventListener('mouseleave',()=>{ const c=cubes[+el.dataset.cube]; gsap.to(c.scale,{x:1,y:1,z:1,duration:.9,ease:'elastic.out(0.7,0.35)'}); gsap.to(c.material,{emissiveIntensity:.08,duration:.4}); }));

const cursor = { x:0, y:0, px:0, py:0, v:0 }; addEventListener('pointermove', e=>{ cursor.x=(e.clientX/innerWidth)*2-1; cursor.y=-(e.clientY/innerHeight)*2+1; });
function resize(){ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); } addEventListener('resize', resize);
function tick(t){ requestAnimationFrame(tick); cursor.v += ((Math.hypot(cursor.x-cursor.px,cursor.y-cursor.py)*8)-cursor.v)*.08; cursor.px=cursor.x; cursor.py=cursor.y; liquidUniforms.uTime.value=t*.001; liquidUniforms.uMouse.value.set(cursor.x,cursor.y); liquidUniforms.uVelocity.value=cursor.v; shiftPass.uniforms.uVelocity.value=cursor.v; shiftPass.uniforms.uTime.value=t*.001; heroBlob.rotation.y += .003; heroBlob.rotation.x = Math.sin(t*.0004)*.18; cubes.forEach((c,i)=>{ c.rotation.x += .004+i*.0005; c.rotation.y += .006; c.position.y += Math.sin(t*.001+i)*.0018; }); particles.rotation.y += .0008; composer.render(); }
tick(0);
