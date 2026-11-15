import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Orbit, 
  Layers, 
  Camera, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  MapPin, 
  Radio,
  Compass
} from 'lucide-react';
import { PRESET_LOCATIONS, PresetLocation } from '../lib/nasaPowerService';

// Module-scope scratch objects to ensure ZERO garbage collection in the 60fps render loop
const _scratchCamPos = new THREE.Vector3();
const _scratchLookAt = new THREE.Vector3();
const _scratchSatWorldPos = new THREE.Vector3();
const _scratchGroundWorldPos = new THREE.Vector3();
const _scratchNadirSurfacePos = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _dummyMatrix = new THREE.Matrix4();
const _dummyColor = new THREE.Color();

// Camera Preset definitions (including 'free' interactive orbit mode)
export type CameraPreset = 'chase' | 'nadir' | 'instrument' | 'ground' | 'cinematic' | 'free';

interface EarthObservatory3DProps {
  initialLocationName?: string;
  onLocationSelect?: (loc: PresetLocation) => void;
  fullBleed?: boolean;
  className?: string;
}

export default function EarthObservatory3D({
  initialLocationName = 'Nagpur',
  onLocationSelect,
  className = ''
}: EarthObservatory3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI State
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'layers' | 'subsystems' | 'telemetry'>('camera');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('chase');
  const [explodedRatio, setExplodedRatio] = useState<number>(0);
  const [activeAtmosphereLayer, setActiveAtmosphereLayer] = useState<'pm25' | 'inversion' | 'precip' | 'aod'>('pm25');
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PresetLocation>(() => {
    return PRESET_LOCATIONS.find(l => l.name.toLowerCase() === initialLocationName.toLowerCase()) || PRESET_LOCATIONS[0];
  });
  const [liveTelemetry, setLiveTelemetry] = useState({
    altitudeKm: 705.4,
    velocityKmS: 7.51,
    subsatelliteLat: 21.14,
    subsatelliteLon: 79.08,
    lidarPulseHz: 20.0,
    solarPowerWatts: 4280,
    atmosphericAOD: 0.42,
    pblHeightMeters: 480
  });

  // Mutable refs for values consumed in the render loop without re-initializing WebGL
  const explodedRatioRef = useRef(explodedRatio);
  explodedRatioRef.current = explodedRatio;

  const cameraPresetRef = useRef<CameraPreset>(cameraPreset);
  cameraPresetRef.current = cameraPreset;

  const orbitSpeedRef = useRef(orbitSpeed);
  orbitSpeedRef.current = orbitSpeed;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const activeAtmosphereLayerRef = useRef(activeAtmosphereLayer);
  activeAtmosphereLayerRef.current = activeAtmosphereLayer;

  const selectedLocationRef = useRef(selectedLocation);
  selectedLocationRef.current = selectedLocation;

  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;

  // Web Audio API Synthesizer for procedural spacecraft telemetry (zero external 404 mp3s)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepTimeRef = useRef(0);

  const playTelemetryChirp = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore autoplay restrictions
    }
  }, []);

  const handleStationChange = (locName: string) => {
    const found = PRESET_LOCATIONS.find(l => l.name === locName);
    if (found) {
      setSelectedLocation(found);
      onLocationSelect?.(found);
    }
  };

  // Main Three.js Scene Setup & Render Loop (runs once on mount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let frameId = 0;
    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;

    // Detect software WebGL (SwiftShader, llvmpipe, Basic Render)
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Dimensions
    const width = Math.max(container.clientWidth || window.innerWidth, 320);
    const height = Math.max(container.clientHeight || window.innerHeight, 360);

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b101e);
    scene.fog = new THREE.FogExp2(0x0b101e, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5.2, 10.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 4. Studio 3-Point Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
    sunLight.position.set(14, 10, 14);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 40;
      sunLight.shadow.camera.left = -7;
      sunLight.shadow.camera.right = 7;
      sunLight.shadow.camera.top = 7;
      sunLight.shadow.camera.bottom = -7;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xa6b7d4, 0x171b2b, 1.35);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xd28b71, 1.1);
    rimLight.position.set(-12, -6, -12);
    scene.add(rimLight);

    // 5. OrbitControls with User Interaction Detection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.8;
    controls.maxDistance = 32.0;
    controls.maxPolarAngle = Math.PI * 0.95;

    // Switch to 'free' camera preset when user manually drags/zooms so camera presets never fight manual orbit
    const onControlStart = () => {
      if (cameraPresetRef.current !== 'free') {
        cameraPresetRef.current = 'free';
        setCameraPreset('free');
      }
    };
    controls.addEventListener('start', onControlStart);

    // -------------------------------------------------------------
    // DEEP SPACE INSTANCED STARFIELD (InstancedMesh + BoundingSphere)
    // -------------------------------------------------------------
    const starCount = 360;
    const starGeo = new THREE.OctahedronGeometry(0.06, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xf0ebdd });
    const starInstanced = new THREE.InstancedMesh(starGeo, starMat, starCount);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 28 + Math.random() * 35;
      const sx = radius * Math.sin(phi) * Math.cos(theta);
      const sy = radius * Math.sin(phi) * Math.sin(theta);
      const sz = radius * Math.cos(phi);
      const scale = 0.5 + Math.random() * 1.3;
      _dummyMatrix.makeRotationFromEuler(new THREE.Euler(Math.random(), Math.random(), 0));
      _dummyMatrix.setPosition(sx, sy, sz);
      _dummyMatrix.scale(new THREE.Vector3(scale, scale, scale));
      starInstanced.setMatrixAt(i, _dummyMatrix);

      const tint = i % 3 === 0 ? 0xa6b7d4 : i % 5 === 0 ? 0xd28b71 : 0xf0ebdd;
      starInstanced.setColorAt(i, _dummyColor.setHex(tint));
    }
    starInstanced.instanceMatrix.needsUpdate = true;
    if (starInstanced.instanceColor) starInstanced.instanceColor.needsUpdate = true;
    starInstanced.computeBoundingSphere();
    scene.add(starInstanced);

    // -------------------------------------------------------------
    // PROCEDURAL EARTH & ATMOSPHERE (Zero External 404 Dependencies)
    // -------------------------------------------------------------
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthRadius = 3.2;

    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const eCtx = earthCanvas.getContext('2d')!;

    // Deep bathymetric ocean gradient
    const oceanGrad = eCtx.createLinearGradient(0, 0, 0, earthCanvas.height);
    oceanGrad.addColorStop(0, '#0f172a');
    oceanGrad.addColorStop(0.5, '#0b192c');
    oceanGrad.addColorStop(1, '#0f172a');
    eCtx.fillStyle = oceanGrad;
    eCtx.fillRect(0, 0, earthCanvas.width, earthCanvas.height);

    // Latitude & Longitude Graticule
    eCtx.strokeStyle = 'rgba(166, 183, 212, 0.18)';
    eCtx.lineWidth = 1.2;
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * earthCanvas.height;
      eCtx.beginPath();
      eCtx.moveTo(0, y);
      eCtx.lineTo(earthCanvas.width, y);
      eCtx.stroke();
    }
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * earthCanvas.width;
      eCtx.beginPath();
      eCtx.moveTo(x, 0);
      eCtx.lineTo(x, earthCanvas.height);
      eCtx.stroke();
    }

    // Procedural Continents with Topographic Contours & Nighttime Urban Clusters
    const drawLandmass = (cx: number, cy: number, rx: number, ry: number, angle = 0) => {
      eCtx.save();
      eCtx.translate(cx, cy);
      eCtx.rotate(angle);
      eCtx.fillStyle = '#1e293b';
      eCtx.beginPath();
      eCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.strokeStyle = '#a6b7d4';
      eCtx.lineWidth = 2.0;
      eCtx.stroke();

      eCtx.fillStyle = '#28354a';
      eCtx.beginPath();
      eCtx.ellipse(0, 0, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
      eCtx.fill();

      eCtx.strokeStyle = 'rgba(210, 139, 113, 0.45)';
      eCtx.lineWidth = 1.2;
      eCtx.beginPath();
      eCtx.ellipse(0, 0, rx * 0.48, ry * 0.48, 0, 0, Math.PI * 2);
      eCtx.stroke();

      // City light nodes
      eCtx.fillStyle = '#f0b44d';
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        const dist = (0.2 + ((k * 7) % 10) * 0.06);
        eCtx.beginPath();
        eCtx.arc(Math.cos(a) * rx * dist, Math.sin(a) * ry * dist, 2.2, 0, Math.PI * 2);
        eCtx.fill();
      }
      eCtx.restore();
    };

    drawLandmass(earthCanvas.width * 0.73, earthCanvas.height * 0.42, 230, 160, 0.1);  // Eurasia / India
    drawLandmass(earthCanvas.width * 0.52, earthCanvas.height * 0.58, 140, 190, -0.15); // Africa
    drawLandmass(earthCanvas.width * 0.50, earthCanvas.height * 0.32, 110, 75, 0.05);   // Europe
    drawLandmass(earthCanvas.width * 0.22, earthCanvas.height * 0.35, 190, 130, -0.2);  // North America
    drawLandmass(earthCanvas.width * 0.31, earthCanvas.height * 0.70, 110, 180, 0.15);  // South America
    drawLandmass(earthCanvas.width * 0.86, earthCanvas.height * 0.75, 95, 75, -0.1);    // Australia

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.55,
      metalness: 0.15,
      emissive: new THREE.Color(0x0b1324),
      emissiveIntensity: 0.45
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.receiveShadow = !isSoftwareGl;
    earthGroup.add(earthMesh);

    // Atmosphere Glow Halo
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.055, 64, 64);
    const atmoUniforms = {
      uGlowColor: { value: new THREE.Color(0xa6b7d4) }
    };
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: atmoUniforms,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uGlowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(uGlowColor, 1.0) * intensity * 2.1;
        }
      `
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // Atmospheric Spectral Layer Mesh (dynamically tinted by activeAtmosphereLayer)
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.02, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf16c72,
      transparent: true,
      opacity: 0.24,
      wireframe: true,
      roughness: 0.8,
      depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);

    // -------------------------------------------------------------
    // GROUND OBSERVATORY & TELEMETRY STATION AT TARGET COORDINATES
    // -------------------------------------------------------------
    const groundStationGroup = new THREE.Group();
    earthGroup.add(groundStationGroup);

    const latLonToVector3 = (lat: number, lon: number, r: number, target = new THREE.Vector3()) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      return target.set(x, y, z);
    };

    const groundPos = latLonToVector3(selectedLocationRef.current.lat, selectedLocationRef.current.lon, earthRadius);
    groundStationGroup.position.copy(groundPos);
    groundStationGroup.quaternion.setFromUnitVectors(_upVec, groundPos.clone().normalize());

    const contactShadowGeo = new THREE.RingGeometry(0.01, 0.2, 32);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x01040a,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.rotation.x = Math.PI / 2;
    contactShadow.position.y = 0.003;
    groundStationGroup.add(contactShadow);

    const padGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.025, 16);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x232a3d, roughness: 0.85, metalness: 0.2 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 0.012;
    groundStationGroup.add(padMesh);

    const domePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 0.5;
      domePoints.push(new THREE.Vector2(Math.cos(a) * 0.07, Math.sin(a) * 0.07));
    }
    const domeGeo = new THREE.LatheGeometry(domePoints, 16);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xa6b7d4,
      roughness: 0.25,
      metalness: 0.75,
      wireframe: true
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 0.025;
    groundStationGroup.add(domeMesh);

    const uplinkBeamGeo = new THREE.CylinderGeometry(0.008, 0.025, 1.9, 12, 1, true);
    const uplinkBeamMat = new THREE.MeshBasicMaterial({
      color: 0x35c98b,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const uplinkBeam = new THREE.Mesh(uplinkBeamGeo, uplinkBeamMat);
    uplinkBeam.position.y = 0.96;
    groundStationGroup.add(uplinkBeam);

    // Sub-satellite Nadir Surface Footprint Ring on Earth
    const nadirFootprintGroup = new THREE.Group();
    scene.add(nadirFootprintGroup);
    const footprintRingGeo = new THREE.RingGeometry(0.32, 0.42, 36);
    const footprintRingMat = new THREE.MeshBasicMaterial({
      color: 0xf16c72,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const footprintRing = new THREE.Mesh(footprintRingGeo, footprintRingMat);
    nadirFootprintGroup.add(footprintRing);

    // -------------------------------------------------------------
    // HERO COMPOSITE SPACECRAFT: "EARTH TRACE SENTINEL-ALPHA"
    // satelliteRoot.lookAt(0,0,0) aligns local +Z towards Earth nadir.
    // spacecraftBodyGroup is rotated so local -Y points along +Z (nadir).
    // -------------------------------------------------------------
    const satelliteRoot = new THREE.Group();
    scene.add(satelliteRoot);

    const spacecraftBodyGroup = new THREE.Group();
    spacecraftBodyGroup.rotation.x = -Math.PI / 2;
    satelliteRoot.add(spacecraftBodyGroup);

    // Exploded sub-assembly groups inside spacecraftBodyGroup
    const busGroup = new THREE.Group();
    const portWingGroup = new THREE.Group();
    const stbdWingGroup = new THREE.Group();
    const dishGroup = new THREE.Group();
    const opticsGroup = new THREE.Group();
    const lidarGroup = new THREE.Group();
    const boomGroup = new THREE.Group();
    const radiatorGroup = new THREE.Group();
    const thrustersGroup = new THREE.Group();

    spacecraftBodyGroup.add(busGroup);
    spacecraftBodyGroup.add(portWingGroup);
    spacecraftBodyGroup.add(stbdWingGroup);
    spacecraftBodyGroup.add(dishGroup);
    spacecraftBodyGroup.add(opticsGroup);
    spacecraftBodyGroup.add(lidarGroup);
    spacecraftBodyGroup.add(boomGroup);
    spacecraftBodyGroup.add(radiatorGroup);
    spacecraftBodyGroup.add(thrustersGroup);

    // 1. Primary Satellite Bus (Extruded Octagon with Bevels, Gold Thermal MLI Foil)
    const busShape = new THREE.Shape();
    const r = 0.42;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) busShape.moveTo(x, y);
      else busShape.lineTo(x, y);
    }
    busShape.closePath();

    const busGeo = new THREE.ExtrudeGeometry(busShape, {
      depth: 0.75,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    });
    busGeo.center();

    const busMat = new THREE.MeshStandardMaterial({
      color: 0xf0b44d,
      metalness: 0.92,
      roughness: 0.22,
      emissive: new THREE.Color(0x5c3a0d),
      emissiveIntensity: 0.25
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.castShadow = !isSoftwareGl;
    busGroup.add(busMesh);

    // 2 & 3. Procedural Solar Array Wings (Port & Starboard)
    const pvCanvas = document.createElement('canvas');
    pvCanvas.width = 512;
    pvCanvas.height = 256;
    const pvCtx = pvCanvas.getContext('2d')!;
    pvCtx.fillStyle = '#111a2e';
    pvCtx.fillRect(0, 0, pvCanvas.width, pvCanvas.height);
    pvCtx.strokeStyle = '#a6b7d4';
    pvCtx.lineWidth = 2;
    for (let x = 0; x < pvCanvas.width; x += 32) {
      pvCtx.beginPath();
      pvCtx.moveTo(x, 0);
      pvCtx.lineTo(x, pvCanvas.height);
      pvCtx.stroke();
    }
    for (let y = 0; y < pvCanvas.height; y += 32) {
      pvCtx.beginPath();
      pvCtx.moveTo(0, y);
      pvCtx.lineTo(pvCanvas.width, y);
      pvCtx.stroke();
    }
    const pvTexture = new THREE.CanvasTexture(pvCanvas);
    pvTexture.colorSpace = THREE.SRGBColorSpace;
    pvTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const wingFrameGeo = new THREE.BoxGeometry(1.3, 0.035, 0.68);
    const wingFrameMat = new THREE.MeshStandardMaterial({
      color: 0x353d55,
      metalness: 0.9,
      roughness: 0.25
    });
    const wingPvMat = new THREE.MeshStandardMaterial({
      map: pvTexture,
      metalness: 0.85,
      roughness: 0.18
    });

    const portFrame = new THREE.Mesh(wingFrameGeo, [
      wingFrameMat, wingFrameMat, wingPvMat, wingPvMat, wingFrameMat, wingFrameMat
    ]);
    portFrame.position.x = 1.12;
    portWingGroup.add(portFrame);

    const gimbalGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.48, 12);
    const titaniumMat = new THREE.MeshStandardMaterial({ color: 0xb5bdcc, metalness: 0.95, roughness: 0.15 });
    const portGimbal = new THREE.Mesh(gimbalGeo, titaniumMat);
    portGimbal.rotation.z = Math.PI / 2;
    portGimbal.position.x = 0.46;
    portWingGroup.add(portGimbal);

    const stbdFrame = new THREE.Mesh(wingFrameGeo, [
      wingFrameMat, wingFrameMat, wingPvMat, wingPvMat, wingFrameMat, wingFrameMat
    ]);
    stbdFrame.position.x = -1.12;
    stbdWingGroup.add(stbdFrame);

    const stbdGimbal = new THREE.Mesh(gimbalGeo, titaniumMat);
    stbdGimbal.rotation.z = Math.PI / 2;
    stbdGimbal.position.x = -0.46;
    stbdWingGroup.add(stbdGimbal);

    // 4. High-Gain Communications Dish Antenna (LatheGeometry Parabola)
    const dishPoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = u * 0.38;
      const y = Math.pow(u, 2) * 0.16;
      dishPoints.push(new THREE.Vector2(x, y));
    }
    const dishGeo = new THREE.LatheGeometry(dishPoints, 24);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebdd,
      metalness: 0.88,
      roughness: 0.28,
      side: THREE.DoubleSide
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = -Math.PI / 3;
    dishMesh.position.set(0, 0.48, 0.35);
    dishGroup.add(dishMesh);

    const feedhornGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.18, 8);
    const feedhorn = new THREE.Mesh(feedhornGeo, titaniumMat);
    feedhorn.position.set(0, 0.58, 0.42);
    dishGroup.add(feedhorn);

    // 5. MERRA-2 Multi-Angle Atmospheric Spectrometer (Nadir-pointing along -Y of spacecraftBodyGroup)
    const opticsBarrelGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 16);
    const carbonBarrelMat = new THREE.MeshStandardMaterial({ color: 0x171b2b, roughness: 0.4, metalness: 0.7 });
    const opticsBarrel = new THREE.Mesh(opticsBarrelGeo, carbonBarrelMat);
    opticsBarrel.position.set(0.15, -0.42, 0.1);
    opticsGroup.add(opticsBarrel);

    const lensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 24);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xa6b7d4,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 1.0,
      roughness: 0.05,
      ior: 1.54,
      clearcoat: 1.0
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0.15, -0.58, 0.1);
    opticsGroup.add(lens);

    // 6. Atmospheric Boundary Layer LiDAR Sounder
    const lidarHousingGeo = new THREE.BoxGeometry(0.22, 0.28, 0.22);
    const lidarHousing = new THREE.Mesh(lidarHousingGeo, carbonBarrelMat);
    lidarHousing.position.set(-0.16, -0.42, -0.05);
    lidarGroup.add(lidarHousing);

    const laserApertureGeo = new THREE.RingGeometry(0.02, 0.075, 16);
    const laserApertureMat = new THREE.MeshBasicMaterial({
      color: 0xf16c72,
      side: THREE.DoubleSide
    });
    const laserAperture = new THREE.Mesh(laserApertureGeo, laserApertureMat);
    laserAperture.rotation.x = Math.PI / 2;
    laserAperture.position.set(-0.16, -0.57, -0.05);
    lidarGroup.add(laserAperture);

    // Volumetric LiDAR Atmospheric Sounding Cone (points along -Y of spacecraftBodyGroup -> straight down to Earth surface!)
    const soundingConeGeo = new THREE.ConeGeometry(0.45, 2.55, 28, 1, true);
    const soundingConeMat = new THREE.MeshBasicMaterial({
      color: 0xf16c72,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const soundingCone = new THREE.Mesh(soundingConeGeo, soundingConeMat);
    // Cone tip is at +Y/2, base is at -Y/2, so at y = -1.85 the tip touches the LiDAR aperture (-0.57) and base reaches the Earth surface (-3.12)!
    soundingCone.position.set(0, -1.85, 0);
    spacecraftBodyGroup.add(soundingCone);

    // 7. Deployable Magnetometer Boom
    const boomCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, -0.4), new THREE.Vector3(0, -0.3, -1.6));
    const boomGeo = new THREE.TubeGeometry(boomCurve, 12, 0.025, 8, false);
    const boomMesh = new THREE.Mesh(boomGeo, titaniumMat);
    boomGroup.add(boomMesh);

    const magPodGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const magPodMat = new THREE.MeshStandardMaterial({ color: 0xd28b71, metalness: 0.9, roughness: 0.15 });
    const magPod = new THREE.Mesh(magPodGeo, magPodMat);
    magPod.position.set(0, -0.3, -1.6);
    boomGroup.add(magPod);

    // 8. Thermal Radiator Heat Rejection Louvers
    const radiatorGeo = new THREE.BoxGeometry(0.55, 0.65, 0.025);
    const radiatorMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebdd,
      metalness: 0.95,
      roughness: 0.15
    });
    const radiator = new THREE.Mesh(radiatorGeo, radiatorMat);
    radiator.position.set(0, 0, -0.44);
    radiatorGroup.add(radiator);

    // 9. Reaction Wheel & Cold-Gas Thruster Cluster
    const nozzlePoints: THREE.Vector2[] = [];
    nozzlePoints.push(new THREE.Vector2(0.015, 0));
    nozzlePoints.push(new THREE.Vector2(0.02, 0.03));
    nozzlePoints.push(new THREE.Vector2(0.045, 0.08));
    const nozzleGeo = new THREE.LatheGeometry(nozzlePoints, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x838fa3, metalness: 0.95, roughness: 0.1 });

    for (let i = 0; i < 4; i++) {
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      const angle = (i / 4) * Math.PI * 2;
      nozzle.position.set(Math.cos(angle) * 0.38, Math.sin(angle) * 0.38, -0.38);
      nozzle.rotation.x = Math.PI / 2;
      thrustersGroup.add(nozzle);
    }

    // Orbit Path Spline
    const orbitRadius = 6.2;
    const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * 0.96, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(128);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xa6b7d4,
      transparent: true,
      opacity: 0.4
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.x = Math.PI / 3.4;
    orbitLine.rotation.z = Math.PI / 6;
    scene.add(orbitLine);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // -------------------------------------------------------------
    // ANIMATION & KINEMATIC SIMULATION LOOP
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let orbitalAngle = 0.65;
    let smoothedExploded = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const animate = () => {
      if (isDisposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Orbital Kinematics
      if (!isPausedRef.current) {
        orbitalAngle += delta * 0.18 * orbitSpeedRef.current;
        earthGroup.rotation.y += delta * 0.035 * orbitSpeedRef.current;
        cloudMesh.rotation.y += delta * 0.048 * orbitSpeedRef.current;
      }

      // Compute Satellite World Position along inclined orbit plane
      const satOrbitX = Math.cos(orbitalAngle) * orbitRadius;
      const satOrbitZ = Math.sin(orbitalAngle) * orbitRadius * 0.96;
      _scratchSatWorldPos.set(satOrbitX, 0, satOrbitZ);
      _scratchSatWorldPos.applyEuler(orbitLine.rotation);
      satelliteRoot.position.copy(_scratchSatWorldPos);

      // Align Satellite +Z axis towards planetary center (0, 0, 0)
      satelliteRoot.lookAt(0, 0, 0);

      // Position sub-satellite nadir footprint ring directly on Earth surface below satellite
      _scratchNadirSurfacePos.copy(_scratchSatWorldPos).normalize().multiplyScalar(earthRadius * 1.008);
      nadirFootprintGroup.position.copy(_scratchNadirSurfacePos);
      nadirFootprintGroup.lookAt(0, 0, 0);

      // Update Spectral Layer & LiDAR Beam Colors based on activeAtmosphereLayerRef
      const layerMode = activeAtmosphereLayerRef.current;
      const layerHex =
        layerMode === 'pm25' ? 0xf16c72 :
        layerMode === 'inversion' ? 0xa6b7d4 :
        layerMode === 'precip' ? 0x35c98b :
        0xf0b44d;

      soundingConeMat.color.setHex(layerHex);
      laserApertureMat.color.setHex(layerHex);
      footprintRingMat.color.setHex(layerHex);
      cloudMat.color.setHex(layerHex);
      atmoUniforms.uGlowColor.value.setHex(layerMode === 'inversion' ? 0xa6b7d4 : layerMode === 'precip' ? 0x35c98b : 0x67e8f9);

      // Sounding cone pulse modulation
      const pulseFactor = 0.5 + 0.5 * Math.sin(elapsed * 6.0);
      soundingConeMat.opacity = 0.18 + 0.16 * pulseFactor;
      footprintRingMat.opacity = 0.45 + 0.35 * pulseFactor;

      // Exploded View Kinematics (Smooth exponential damping from 0.0 to 1.0)
      smoothedExploded = THREE.MathUtils.damp(smoothedExploded, explodedRatioRef.current, 6, delta);

      portWingGroup.position.x = smoothedExploded * 1.15;
      stbdWingGroup.position.x = -smoothedExploded * 1.15;
      dishGroup.position.y = smoothedExploded * 0.75;
      opticsGroup.position.y = -smoothedExploded * 0.65;
      opticsGroup.position.x = smoothedExploded * 0.35;
      lidarGroup.position.y = -smoothedExploded * 0.65;
      lidarGroup.position.x = -smoothedExploded * 0.35;
      boomGroup.position.z = -smoothedExploded * 0.95;
      radiatorGroup.position.z = -smoothedExploded * 0.55;
      thrustersGroup.position.z = -smoothedExploded * 0.8;

      // Update Ground Station position according to target location
      latLonToVector3(selectedLocationRef.current.lat, selectedLocationRef.current.lon, earthRadius, groundPos);
      groundStationGroup.position.copy(groundPos);
      groundStationGroup.quaternion.setFromUnitVectors(_upVec, groundPos.clone().normalize());

      // Telemetry audio trigger
      if (Math.floor(elapsed * 2) !== lastBeepTimeRef.current) {
        lastBeepTimeRef.current = Math.floor(elapsed * 2);
        playTelemetryChirp();
      }

      // Camera Presets with Smooth Damped Interpolation (yields to user in 'free' mode)
      const preset = cameraPresetRef.current;
      if (preset === 'chase') {
        const offset = new THREE.Vector3(2.2, 1.8, -3.6).applyQuaternion(satelliteRoot.quaternion);
        _scratchCamPos.copy(satelliteRoot.position).add(offset);
        _scratchLookAt.copy(satelliteRoot.position).lerp(new THREE.Vector3(0, 0, 0), 0.35);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-4 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-6 * delta));
      } else if (preset === 'nadir') {
        const nadirPos = satelliteRoot.position.clone().multiplyScalar(1.38);
        _scratchCamPos.copy(nadirPos);
        _scratchLookAt.set(0, 0, 0);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-4 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-6 * delta));
      } else if (preset === 'instrument') {
        const offset = new THREE.Vector3(1.35, 0.75, -1.45).applyQuaternion(satelliteRoot.quaternion);
        _scratchCamPos.copy(satelliteRoot.position).add(offset);
        _scratchLookAt.copy(satelliteRoot.position);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-5 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-6 * delta));
      } else if (preset === 'ground') {
        groundStationGroup.getWorldPosition(_scratchGroundWorldPos);
        const groundCamOffset = _scratchGroundWorldPos.clone().normalize().multiplyScalar(1.8);
        _scratchCamPos.copy(_scratchGroundWorldPos).add(groundCamOffset);
        _scratchLookAt.copy(satelliteRoot.position);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-3 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-5 * delta));
      } else if (preset === 'cinematic') {
        const cinX = Math.sin(elapsed * 0.16) * 11.5;
        const cinZ = Math.cos(elapsed * 0.16) * 11.5;
        _scratchCamPos.set(cinX, 4.8, cinZ);
        _scratchLookAt.set(0, 0, 0);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-2.5 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-4 * delta));
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    animate();

    // -------------------------------------------------------------
    // RESIZE OBSERVER (Debounced with requestAnimationFrame)
    // -------------------------------------------------------------
    let resizeRafId = 0;
    let lastW = width;
    let lastH = height;

    resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length || isDisposed) return;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        if (isDisposed) return;
        const entry = entries[0];
        const w = Math.max(Math.floor(entry.contentRect.width || container.clientWidth), 300);
        const h = Math.max(Math.floor(entry.contentRect.height || container.clientHeight), 320);

        if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
          lastW = w;
          lastH = h;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
      });
    });
    resizeObserver.observe(container);

    // Live telemetry poll interval
    const telemetryInterval = setInterval(() => {
      const mode = activeAtmosphereLayerRef.current;
      setLiveTelemetry(prev => ({
        ...prev,
        subsatelliteLat: Number((selectedLocationRef.current.lat + Math.sin(orbitalAngle) * 5).toFixed(2)),
        subsatelliteLon: Number((selectedLocationRef.current.lon + Math.cos(orbitalAngle) * 8).toFixed(2)),
        solarPowerWatts: Math.round(4200 + Math.sin(orbitalAngle * 2) * 220),
        atmosphericAOD: Number((mode === 'aod' ? 0.68 : mode === 'pm25' ? 0.54 : 0.38).toFixed(2)),
        pblHeightMeters: Math.round((mode === 'inversion' ? 340 : 480) + Math.cos(orbitalAngle * 3) * 55)
      }));
    }, 1000);

    // Cleanup resources
    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      cancelAnimationFrame(resizeRafId);
      clearInterval(telemetryInterval);
      resizeObserver?.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();

      envTexture.dispose();
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      earthTexture.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      contactShadowGeo.dispose();
      contactShadowMat.dispose();
      padGeo.dispose();
      padMat.dispose();
      domeGeo.dispose();
      domeMat.dispose();
      uplinkBeamGeo.dispose();
      uplinkBeamMat.dispose();
      footprintRingGeo.dispose();
      footprintRingMat.dispose();
      busGeo.dispose();
      busMat.dispose();
      wingFrameGeo.dispose();
      wingFrameMat.dispose();
      wingPvMat.dispose();
      pvTexture.dispose();
      gimbalGeo.dispose();
      titaniumMat.dispose();
      dishGeo.dispose();
      dishMat.dispose();
      feedhornGeo.dispose();
      opticsBarrelGeo.dispose();
      carbonBarrelMat.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      lidarHousingGeo.dispose();
      laserApertureGeo.dispose();
      laserApertureMat.dispose();
      soundingConeGeo.dispose();
      soundingConeMat.dispose();
      boomGeo.dispose();
      magPodGeo.dispose();
      magPodMat.dispose();
      radiatorGeo.dispose();
      radiatorMat.dispose();
      nozzleGeo.dispose();
      nozzleMat.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [playTelemetryChirp]);

  // Keyboard shortcut 'H' to toggle controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setIsControlsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[450px] sm:min-h-[520px] select-none overflow-hidden bg-[#171B2B] ${className}`}>
      {/* 3D WebGL Canvas Ref Mount (isolated outside re-rendering HUD) */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center z-0" 
      />

      {/* Top-Left Minimal Spec & Target Station Selector */}
      <div className="absolute top-14 sm:top-4 left-3 sm:left-4 z-20 flex flex-col gap-1.5 pointer-events-none max-w-[75vw] sm:max-w-sm">
        <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#232A3D] border border-[#48516A] rounded-xl text-[11px] sm:text-xs font-mono text-[#F0EBDD] shadow-2xl pointer-events-auto">
          <Orbit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A6B7D4] shrink-0" />
          <span className="font-bold tracking-wide text-[#F0EBDD] truncate">SENTINEL-ALPHA</span>
          <span className="text-[9px] sm:text-[10px] text-[#A6B7D4] px-1.5 py-0.5 rounded bg-[#1D2436] border border-[#48516A] shrink-0">
            LEO 705 KM
          </span>
        </div>

        <div className="text-[10px] font-mono text-[#B5BDCC] bg-[#232A3D] border border-[#48516A] px-2.5 py-1.5 rounded-lg flex items-center gap-2 pointer-events-auto shadow-lg">
          <MapPin className="w-3 h-3 text-[#A6B7D4] shrink-0" />
          <span className="text-[#838FA3] shrink-0">Target:</span>
          <select
            value={selectedLocation.name}
            onChange={(e) => handleStationChange(e.target.value)}
            className="bg-[#1D2436] text-[#F0EBDD] border border-[#48516A] rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none focus:border-[#A6B7D4] cursor-pointer truncate"
          >
            {PRESET_LOCATIONS.map(loc => (
              <option key={loc.name} value={loc.name} className="bg-[#1D2436] text-[#F0EBDD]">
                {loc.name} ({loc.lat.toFixed(1)}°N, {loc.lon.toFixed(1)}°E)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top-Right Telemetry Audio & Zen HUD Toggle */}
      <div className="absolute top-14 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? "Mute Spacecraft Telemetry Beep" : "Enable Spacecraft Telemetry Synthesizer"}
          className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xl ${
            audioEnabled 
              ? 'bg-[#353D55] border-[#A6B7D4] text-[#F0EBDD]' 
              : 'bg-[#232A3D] border-[#48516A] text-[#B5BDCC] hover:text-[#F0EBDD]'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-[#A6B7D4]" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden md:inline text-[11px]">{audioEnabled ? 'Telemetry Audio ON' : 'Audio Muted'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="p-2 bg-[#232A3D] border border-[#48516A] hover:border-[#A6B7D4] text-[#B5BDCC] hover:text-[#F0EBDD] rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 shadow-xl"
          title="Toggle Controls (Hotkey: H)"
        >
          {isControlsCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          <span className="hidden md:inline text-[11px]">{isControlsCollapsed ? 'Show HUD (H)' : 'Hide (H)'}</span>
        </button>
      </div>

      {/* Viewport-First Collapsible Bottom Control Dock */}
      <div 
        className={`absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-[920px] transition-all duration-300 ease-out pointer-events-auto ${
          isControlsCollapsed ? 'translate-y-[calc(100%+24px)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="bg-[#232A3D] border border-[#48516A] rounded-2xl shadow-2xl p-2.5 sm:p-3 flex flex-col gap-2">
          {/* Dock Tab Selector & Speed Controls */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#2D354A] pb-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1 bg-[#1D2436] p-1 rounded-xl border border-[#48516A] overflow-x-auto max-w-full scrollbar-none">
              {[
                { id: 'camera', label: 'Camera', icon: Camera },
                { id: 'subsystems', label: 'Subsystems', icon: Sliders },
                { id: 'layers', label: 'LiDAR Layers', icon: Layers },
                { id: 'telemetry', label: 'Telemetry', icon: Radio },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer text-[10px] sm:text-[11px] whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm' 
                        : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulation Speed & Pause Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-lg bg-[#1D2436] border border-[#48516A] hover:border-[#A6B7D4] text-[#A6B7D4] transition-colors cursor-pointer"
                title={isPaused ? "Resume Orbit Simulation" : "Pause Orbit Simulation"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1 bg-[#1D2436] px-2 py-1 rounded-lg border border-[#48516A] text-[10px]">
                <span className="text-[#838FA3]">Speed:</span>
                {[0.5, 1.0, 2.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setOrbitSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      orbitSpeed === spd ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'camera' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[10px] text-[#B5BDCC] uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#A6B7D4]" />
                <span>View Mode (Drag to Free Orbit):</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'chase', label: '🛰️ Satellite Chase' },
                  { id: 'nadir', label: '🌍 Planetary Nadir' },
                  { id: 'instrument', label: '🔬 LiDAR Optics' },
                  { id: 'ground', label: '📡 Ground Station' },
                  { id: 'cinematic', label: '🎬 Cinematic Flyby' },
                  { id: 'free', label: '🕹️ Free Orbit' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCameraPreset(preset.id as CameraPreset)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-[10px] sm:text-[11px] ${
                      cameraPreset === preset.id
                        ? 'bg-[#353D55] text-[#F0EBDD] border-[#A6B7D4] font-bold shadow-sm'
                        : 'bg-[#1D2436] text-[#B5BDCC] border-[#48516A] hover:border-[#64718A] hover:text-[#F0EBDD]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subsystems' && (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#F0EBDD] font-semibold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#A6B7D4]" />
                  Spacecraft Exploded-View Kinematics
                </span>
                <span className="text-[#A6B7D4] font-bold">{Math.round(explodedRatio * 100)}% Displaced</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#838FA3] hidden sm:inline">Flight (0%)</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedRatio}
                  onChange={(e) => {
                    setExplodedRatio(parseFloat(e.target.value));
                    if (cameraPresetRef.current !== 'instrument' && cameraPresetRef.current !== 'chase' && cameraPresetRef.current !== 'free') {
                      setCameraPreset('instrument');
                    }
                  }}
                  className="flex-1 h-1.5 bg-[#1D2436] rounded-lg appearance-none cursor-pointer accent-[#A6B7D4]"
                />
                <span className="text-[10px] text-[#838FA3] hidden sm:inline">Exploded (100%)</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#B5BDCC] pt-0.5">
                <span className="truncate">Displaces: Solar Wings · High-Gain Dish · MERRA-2 Spectrometer · LiDAR</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = explodedRatio > 0 ? 0 : 0.85;
                    setExplodedRatio(next);
                    if (next > 0) setCameraPreset('instrument');
                  }}
                  className="text-[#A6B7D4] hover:underline cursor-pointer font-semibold shrink-0"
                >
                  {explodedRatio > 0 ? 'Reset to Flight (0%)' : 'Expand Subassemblies (85%)'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[10px] text-[#B5BDCC] uppercase tracking-wider">Atmospheric LiDAR Mode:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'pm25', label: 'PM2.5 Aerosol Burden', color: 'border-[#F16C72] text-[#F16C72]' },
                  { id: 'inversion', label: 'Boundary Layer Inversion Lid', color: 'border-[#A6B7D4] text-[#A6B7D4]' },
                  { id: 'precip', label: 'Cloud Rain Wet Deposition', color: 'border-[#35C98B] text-[#35C98B]' },
                  { id: 'aod', label: 'MODIS Aerosol Optical Depth', color: 'border-[#F0B44D] text-[#F0B44D]' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveAtmosphereLayer(layer.id as any)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-[10px] sm:text-[11px] ${
                      activeAtmosphereLayer === layer.id
                        ? `bg-[#1D2436] ${layer.color} font-bold shadow-sm`
                        : 'bg-[#1D2436] text-[#B5BDCC] border-[#48516A] hover:text-[#F0EBDD]'
                    }`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-[#1D2436] rounded-xl border border-[#48516A]">
                <div className="text-[#838FA3]">Altitude / Speed:</div>
                <div className="text-[#F0EBDD] font-bold">{liveTelemetry.altitudeKm} km · {liveTelemetry.velocityKmS} km/s</div>
              </div>
              <div className="p-2 bg-[#1D2436] rounded-xl border border-[#48516A]">
                <div className="text-[#838FA3]">Subsatellite Point:</div>
                <div className="text-[#A6B7D4] font-bold">{liveTelemetry.subsatelliteLat}°N, {liveTelemetry.subsatelliteLon}°E</div>
              </div>
              <div className="p-2 bg-[#1D2436] rounded-xl border border-[#48516A]">
                <div className="text-[#838FA3]">Solar Array Power:</div>
                <div className="text-[#35C98B] font-bold">{liveTelemetry.solarPowerWatts} Watts</div>
              </div>
              <div className="p-2 bg-[#1D2436] rounded-xl border border-[#48516A]">
                <div className="text-[#838FA3]">LiDAR Sounder PBL Height:</div>
                <div className="text-[#D28B71] font-bold">{liveTelemetry.pblHeightMeters} m MSL</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
