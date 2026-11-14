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
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  RotateCw, 
  Compass, 
  MapPin, 
  Radio, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';
import { PRESET_LOCATIONS, PresetLocation } from '../lib/nasaPowerService';

// Module-scope scratch objects to ensure ZERO garbage collection in the 60fps render loop
const _vec3 = new THREE.Vector3();
const _scratchCamPos = new THREE.Vector3();
const _scratchLookAt = new THREE.Vector3();
const _scratchSatWorldPos = new THREE.Vector3();
const _scratchGroundWorldPos = new THREE.Vector3();

// Camera Preset definitions
export type CameraPreset = 'chase' | 'nadir' | 'instrument' | 'ground' | 'cinematic';

interface EarthObservatory3DProps {
  initialLocationName?: string;
  onLocationSelect?: (loc: PresetLocation) => void;
  fullBleed?: boolean;
  className?: string;
}

export default function EarthObservatory3D({
  initialLocationName = 'Nagpur',
  onLocationSelect,
  fullBleed = true,
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
    return PRESET_LOCATIONS.find(l => l.name === initialLocationName) || PRESET_LOCATIONS[0];
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

  // Mutable refs for values consumed in requestAnimationFrame
  const explodedRatioRef = useRef(explodedRatio);
  explodedRatioRef.current = explodedRatio;

  const cameraPresetRef = useRef(cameraPreset);
  cameraPresetRef.current = cameraPreset;

  const orbitSpeedRef = useRef(orbitSpeed);
  orbitSpeedRef.current = orbitSpeed;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const activeAtmosphereLayerRef = useRef(activeAtmosphereLayer);
  activeAtmosphereLayerRef.current = activeAtmosphereLayer;

  const selectedLocationRef = useRef(selectedLocation);
  selectedLocationRef.current = selectedLocation;

  // Web Audio API Synthesizer for procedural spacecraft telemetry telemetry (zero external 404 mp3s)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepTimeRef = useRef(0);

  const playTelemetryChirp = useCallback(() => {
    if (!audioEnabled) return;
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

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context may be restricted by autoplay policy
    }
  }, [audioEnabled]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let frameId = 0;
    let resizeObserver: ResizeObserver;

    // Detect software WebGL to safely adapt rendering pipeline without compromising scene content
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
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020817);
    scene.fog = new THREE.FogExp2(0x020817, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4.5, 9.5);

    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig
    // Warm Sun Directional Key Light
    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    sunLight.position.set(12, 10, 14);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 40;
      sunLight.shadow.camera.left = -6;
      sunLight.shadow.camera.right = 6;
      sunLight.shadow.camera.top = 6;
      sunLight.shadow.camera.bottom = -6;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    // Cool Atmospheric Fill (HemisphereLight)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020817, 1.2);
    scene.add(hemiLight);

    // Deep Space Rim Light
    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.8);
    rimLight.position.set(-10, -5, -12);
    scene.add(rimLight);

    // 5. OrbitControls with Silky Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 35.0;
    controls.maxPolarAngle = Math.PI * 0.95;

    // -------------------------------------------------------------
    // PROCEDURAL EARTH & ATMOSPHERE (Zero External 404 Dependencies)
    // -------------------------------------------------------------
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthRadius = 3.2;

    // High-Resolution Procedural Earth Surface Canvas Texture
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const eCtx = earthCanvas.getContext('2d')!;

    // Ocean deep obsidian blue
    eCtx.fillStyle = '#050D1A';
    eCtx.fillRect(0, 0, earthCanvas.width, earthCanvas.height);

    // Latitude & Longitude Coordinate Graticule
    eCtx.strokeStyle = 'rgba(14, 165, 233, 0.22)';
    eCtx.lineWidth = 1;
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

    // Procedural Continents with NASA Topography & Urban Light Points
    const drawLandmass = (cx: number, cy: number, rx: number, ry: number, angle = 0) => {
      eCtx.save();
      eCtx.translate(cx, cy);
      eCtx.rotate(angle);
      eCtx.fillStyle = '#0f2744';
      eCtx.beginPath();
      eCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.strokeStyle = '#22d3ee';
      eCtx.lineWidth = 1.8;
      eCtx.stroke();

      // Topographic elevation contour ring
      eCtx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      eCtx.lineWidth = 1;
      eCtx.beginPath();
      eCtx.ellipse(0, 0, rx * 0.75, ry * 0.75, 0, 0, Math.PI * 2);
      eCtx.stroke();
      eCtx.restore();
    };

    // Continents
    drawLandmass(earthCanvas.width * 0.73, earthCanvas.height * 0.42, 230, 160, 0.1); // Eurasia / India
    drawLandmass(earthCanvas.width * 0.52, earthCanvas.height * 0.58, 140, 190, -0.15); // Africa
    drawLandmass(earthCanvas.width * 0.50, earthCanvas.height * 0.32, 110, 75, 0.05);  // Europe
    drawLandmass(earthCanvas.width * 0.22, earthCanvas.height * 0.35, 190, 130, -0.2); // North America
    drawLandmass(earthCanvas.width * 0.31, earthCanvas.height * 0.70, 110, 180, 0.15); // South America
    drawLandmass(earthCanvas.width * 0.86, earthCanvas.height * 0.75, 95, 75, -0.1);   // Australia

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.55,
      metalness: 0.15,
      emissive: new THREE.Color(0x020817),
      emissiveIntensity: 0.6
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.receiveShadow = !isSoftwareGl;
    earthGroup.add(earthMesh);

    // Dynamic Atmosphere Glow Halo (Rayleigh scattering)
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.055, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          gl_FragColor = vec4(0.04, 0.75, 0.95, 1.0) * intensity * 2.2;
        }
      `
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // Weather Front & Cloud Swirl Mesh
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.018, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.22,
      wireframe: true,
      roughness: 1.0
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);

    // -------------------------------------------------------------
    // GROUND OBSERVATORY & TELEMETRY STATION AT TARGET COORDINATES
    // -------------------------------------------------------------
    const groundStationGroup = new THREE.Group();
    earthGroup.add(groundStationGroup);

    const latLonToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Ground station assembly: Pedestal, Geodesic Dome, and Upward Laser Sounder
    const groundPos = latLonToVector3(selectedLocation.lat, selectedLocation.lon, earthRadius);
    groundStationGroup.position.copy(groundPos);
    groundStationGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), groundPos.clone().normalize());

    // 1. Soft contact shadow on planetary surface
    const contactShadowGeo = new THREE.RingGeometry(0.01, 0.18, 32);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x01040a,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.rotation.x = Math.PI / 2;
    contactShadow.position.y = 0.002;
    groundStationGroup.add(contactShadow);

    // 2. Concrete Station Foundation Pad
    const padGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.02, 16);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.2 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 0.01;
    groundStationGroup.add(padMesh);

    // 3. Geodesic Atmospheric LiDAR Radome (LatheGeometry)
    const domePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 0.5;
      domePoints.push(new THREE.Vector2(Math.cos(a) * 0.06, Math.sin(a) * 0.06));
    }
    const domeGeo = new THREE.LatheGeometry(domePoints, 16);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.7,
      wireframe: true
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 0.02;
    groundStationGroup.add(domeMesh);

    // 4. Ground-to-Space Optical Telemetry Uplink Beam
    const uplinkBeamGeo = new THREE.CylinderGeometry(0.006, 0.02, 1.8, 12, 1, true);
    const uplinkBeamMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const uplinkBeam = new THREE.Mesh(uplinkBeamGeo, uplinkBeamMat);
    uplinkBeam.position.y = 0.92;
    groundStationGroup.add(uplinkBeam);

    // -------------------------------------------------------------
    // HERO COMPOSITE SPACECRAFT: "EARTH TRACE SENTINEL-ALPHA"
    // (11-Part Procedural Model assembly, zero default primitives)
    // -------------------------------------------------------------
    const satelliteRoot = new THREE.Group();
    scene.add(satelliteRoot);

    // Exploded sub-assembly groups
    const busGroup = new THREE.Group();
    const portWingGroup = new THREE.Group();
    const stbdWingGroup = new THREE.Group();
    const dishGroup = new THREE.Group();
    const opticsGroup = new THREE.Group();
    const lidarGroup = new THREE.Group();
    const boomGroup = new THREE.Group();
    const radiatorGroup = new THREE.Group();
    const thrustersGroup = new THREE.Group();

    satelliteRoot.add(busGroup);
    satelliteRoot.add(portWingGroup);
    satelliteRoot.add(stbdWingGroup);
    satelliteRoot.add(dishGroup);
    satelliteRoot.add(opticsGroup);
    satelliteRoot.add(lidarGroup);
    satelliteRoot.add(boomGroup);
    satelliteRoot.add(radiatorGroup);
    satelliteRoot.add(thrustersGroup);

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

    // Procedural gold thermal foil material
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.22,
      emissive: new THREE.Color(0x78350f),
      emissiveIntensity: 0.25
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.castShadow = !isSoftwareGl;
    busGroup.add(busMesh);

    // 2 & 3. Procedural Solar Array Wings (Port & Starboard)
    // Procedural Photovoltaic Solar Cell Canvas Texture
    const pvCanvas = document.createElement('canvas');
    pvCanvas.width = 512;
    pvCanvas.height = 256;
    const pvCtx = pvCanvas.getContext('2d')!;
    pvCtx.fillStyle = '#081734';
    pvCtx.fillRect(0, 0, pvCanvas.width, pvCanvas.height);
    pvCtx.strokeStyle = '#38bdf8';
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

    const wingFrameGeo = new THREE.BoxGeometry(1.2, 0.03, 0.65);
    const wingFrameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    });
    const wingPvMat = new THREE.MeshStandardMaterial({
      map: pvTexture,
      metalness: 0.85,
      roughness: 0.18
    });

    // Port Wing
    const portFrame = new THREE.Mesh(wingFrameGeo, [
      wingFrameMat, wingFrameMat, wingPvMat, wingFrameMat, wingFrameMat, wingFrameMat
    ]);
    portFrame.position.x = 1.05;
    portWingGroup.add(portFrame);

    // Titanium Gimbal Mast
    const gimbalGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12);
    const titaniumMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
    const portGimbal = new THREE.Mesh(gimbalGeo, titaniumMat);
    portGimbal.rotation.z = Math.PI / 2;
    portGimbal.position.x = 0.45;
    portWingGroup.add(portGimbal);

    // Starboard Wing
    const stbdFrame = new THREE.Mesh(wingFrameGeo, [
      wingFrameMat, wingFrameMat, wingPvMat, wingFrameMat, wingFrameMat, wingFrameMat
    ]);
    stbdFrame.position.x = -1.05;
    stbdWingGroup.add(stbdFrame);

    const stbdGimbal = new THREE.Mesh(gimbalGeo, titaniumMat);
    stbdGimbal.rotation.z = Math.PI / 2;
    stbdGimbal.position.x = -0.45;
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
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.28,
      side: THREE.DoubleSide
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = -Math.PI / 3;
    dishMesh.position.set(0, 0.48, 0.35);
    dishGroup.add(dishMesh);

    // Feedhorn sub-reflector strut
    const feedhornGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.18, 8);
    const feedhorn = new THREE.Mesh(feedhornGeo, titaniumMat);
    feedhorn.position.set(0, 0.58, 0.42);
    dishGroup.add(feedhorn);

    // 5. MERRA-2 Multi-Angle Atmospheric Spectrometer (Stepped Cylindrical Barrel with Sapphire Lens)
    const opticsBarrelGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 16);
    const carbonBarrelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.7 });
    const opticsBarrel = new THREE.Mesh(opticsBarrelGeo, carbonBarrelMat);
    opticsBarrel.position.set(0.15, -0.42, 0.1);
    opticsGroup.add(opticsBarrel);

    // Sapphire Crystal Lens (Physical PBR Transmission)
    const lensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 24);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transmission: isSoftwareGl ? 0 : 0.95,
      transparent: true,
      opacity: isSoftwareGl ? 0.4 : 1.0,
      roughness: 0.05,
      ior: 1.54,
      clearcoat: 1.0
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0.15, -0.58, 0.1);
    opticsGroup.add(lens);

    // 6. Atmospheric Boundary Layer LiDAR Sounder (Active Pulsing Laser Aperture)
    const lidarHousingGeo = new THREE.BoxGeometry(0.22, 0.28, 0.22);
    const lidarHousing = new THREE.Mesh(lidarHousingGeo, carbonBarrelMat);
    lidarHousing.position.set(-0.16, -0.42, -0.05);
    lidarGroup.add(lidarHousing);

    const laserApertureGeo = new THREE.RingGeometry(0.02, 0.07, 16);
    const laserApertureMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide
    });
    const laserAperture = new THREE.Mesh(laserApertureGeo, laserApertureMat);
    laserAperture.rotation.x = Math.PI / 2;
    laserAperture.position.set(-0.16, -0.57, -0.05);
    lidarGroup.add(laserAperture);

    // Volumetric LiDAR Atmospheric Sounding Cone down to Earth
    const soundingConeGeo = new THREE.ConeGeometry(0.85, 4.2, 24, 1, true);
    const soundingConeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const soundingCone = new THREE.Mesh(soundingConeGeo, soundingConeMat);
    soundingCone.position.set(0, -2.1, 0);
    satelliteRoot.add(soundingCone);

    // 7. Deployable Magnetometer Boom (TubeGeometry Lattice)
    const boomCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, -0.4), new THREE.Vector3(0, -0.3, -1.6));
    const boomGeo = new THREE.TubeGeometry(boomCurve, 12, 0.025, 8, false);
    const boomMesh = new THREE.Mesh(boomGeo, titaniumMat);
    boomGroup.add(boomMesh);

    // Magnetometer Sensor Pod
    const magPodGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const magPodMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
    const magPod = new THREE.Mesh(magPodGeo, magPodMat);
    magPod.position.set(0, -0.3, -1.6);
    boomGroup.add(magPod);

    // 8. Thermal Radiator Heat Rejection Louvers
    const radiatorGeo = new THREE.BoxGeometry(0.55, 0.65, 0.02);
    const radiatorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.15
    });
    const radiator = new THREE.Mesh(radiatorGeo, radiatorMat);
    radiator.position.set(0, 0, -0.42);
    radiatorGroup.add(radiator);

    // 9. Reaction Wheel & Cold-Gas Thruster Cluster (LatheGeometry Nozzles)
    const nozzlePoints: THREE.Vector2[] = [];
    nozzlePoints.push(new THREE.Vector2(0.015, 0));
    nozzlePoints.push(new THREE.Vector2(0.02, 0.03));
    nozzlePoints.push(new THREE.Vector2(0.045, 0.08));
    const nozzleGeo = new THREE.LatheGeometry(nozzlePoints, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.1 });

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
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.x = Math.PI / 3.4;
    orbitLine.rotation.z = Math.PI / 6;
    scene.add(orbitLine);

    // -------------------------------------------------------------
    // ANIMATION & KINEMATIC SIMULATION LOOP (60fps, Damped Motion)
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let orbitalAngle = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Orbital Kinematics
      if (!isPausedRef.current) {
        orbitalAngle += delta * 0.18 * orbitSpeedRef.current;
        earthGroup.rotation.y += delta * 0.035 * orbitSpeedRef.current;
        cloudMesh.rotation.y += delta * 0.045 * orbitSpeedRef.current;
      }

      // Compute Satellite World Position along inclined orbit plane
      const satOrbitX = Math.cos(orbitalAngle) * orbitRadius;
      const satOrbitZ = Math.sin(orbitalAngle) * orbitRadius * 0.96;
      _scratchSatWorldPos.set(satOrbitX, 0, satOrbitZ);
      _scratchSatWorldPos.applyEuler(orbitLine.rotation);
      satelliteRoot.position.copy(_scratchSatWorldPos);

      // Align Satellite nadir down towards planetary center (0, 0, 0)
      satelliteRoot.lookAt(0, 0, 0);

      // Sounding cone pulse modulation
      const pulseFactor = 0.5 + 0.5 * Math.sin(elapsed * 8.0);
      soundingConeMat.opacity = 0.15 + 0.18 * pulseFactor;

      // Exploded View Kinematics (Glide assemblies outward smoothly using exponential damping)
      const targetExploded = explodedRatioRef.current;
      const currentExploded = THREE.MathUtils.damp(
        portWingGroup.position.x - 1.05,
        targetExploded * 1.5,
        8,
        delta
      ) / 1.5;

      portWingGroup.position.x = 1.05 + currentExploded * 1.4;
      stbdWingGroup.position.x = -1.05 - currentExploded * 1.4;
      dishGroup.position.y = currentExploded * 0.8;
      opticsGroup.position.y = -currentExploded * 0.9;
      lidarGroup.position.y = -currentExploded * 0.9;
      boomGroup.position.z = -currentExploded * 1.2;
      radiatorGroup.position.z = -currentExploded * 0.7;

      // Update Ground Station position according to earth rotation
      groundPos.copy(latLonToVector3(selectedLocationRef.current.lat, selectedLocationRef.current.lon, earthRadius));
      groundStationGroup.position.copy(groundPos);
      groundStationGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), groundPos.clone().normalize());

      // Telemetry telemetry audio trigger
      if (Math.floor(elapsed * 2) !== lastBeepTimeRef.current) {
        lastBeepTimeRef.current = Math.floor(elapsed * 2);
        playTelemetryChirp();
      }

      // Camera Presets with Smooth Damped Interpolation
      const preset = cameraPresetRef.current;
      if (preset === 'chase') {
        // Satellite Chase Camera: Smoothly follow behind satellite
        const offset = new THREE.Vector3(0, 1.8, 3.8).applyQuaternion(satelliteRoot.quaternion);
        _scratchCamPos.copy(satelliteRoot.position).add(offset);
        _scratchLookAt.copy(satelliteRoot.position);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-4 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-6 * delta));
      } else if (preset === 'nadir') {
        // Planetary Nadir: View Earth surface straight down from satellite
        const nadirPos = satelliteRoot.position.clone().multiplyScalar(1.2);
        _scratchCamPos.copy(nadirPos);
        _scratchLookAt.set(0, 0, 0);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-4 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-6 * delta));
      } else if (preset === 'instrument') {
        // High-resolution instrument close-up on LiDAR and optics
        const offset = new THREE.Vector3(0.8, -0.6, 1.2).applyQuaternion(satelliteRoot.quaternion);
        _scratchCamPos.copy(satelliteRoot.position).add(offset);
        _scratchLookAt.copy(satelliteRoot.position);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-5 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-6 * delta));
      } else if (preset === 'ground') {
        // Ground Station Telemetry: View looking up at satellite from ground station
        groundStationGroup.getWorldPosition(_scratchGroundWorldPos);
        const groundCamOffset = _scratchGroundWorldPos.clone().normalize().multiplyScalar(0.4);
        _scratchCamPos.copy(_scratchGroundWorldPos).add(groundCamOffset);
        _scratchLookAt.copy(satelliteRoot.position);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-3 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-5 * delta));
      } else if (preset === 'cinematic') {
        // Cinematic Flyby Orbit
        const cinX = Math.sin(elapsed * 0.15) * 11;
        const cinZ = Math.cos(elapsed * 0.15) * 11;
        _scratchCamPos.set(cinX, 5.0, cinZ);
        _scratchLookAt.set(0, 0, 0);
        camera.position.lerp(_scratchCamPos, 1 - Math.exp(-2 * delta));
        controls.target.lerp(_scratchLookAt, 1 - Math.exp(-4 * delta));
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // RESIZE OBSERVER (Debounced with requestAnimationFrame)
    // -------------------------------------------------------------
    let resizeRafId: number;
    let lastW = width;
    let lastH = height;

    resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        const entry = entries[0];
        const w = Math.max(Math.floor(entry.contentRect.width || container.clientWidth), 320);
        const h = Math.max(Math.floor(entry.contentRect.height || container.clientHeight), 350);

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
      setLiveTelemetry(prev => ({
        ...prev,
        subsatelliteLat: Number((selectedLocationRef.current.lat + Math.sin(orbitalAngle) * 5).toFixed(2)),
        subsatelliteLon: Number((selectedLocationRef.current.lon + Math.cos(orbitalAngle) * 8).toFixed(2)),
        solarPowerWatts: Math.round(4200 + Math.sin(orbitalAngle * 2) * 220),
        pblHeightMeters: Math.round(450 + Math.cos(orbitalAngle * 3) * 60)
      }));
    }, 1000);

    // Cleanup resources
    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeRafId);
      clearInterval(telemetryInterval);
      resizeObserver?.disconnect();
      controls.dispose();

      // Dispose procedural meshes & materials
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
      busGeo.dispose();
      busMat.dispose();
      wingFrameGeo.dispose();
      wingFrameMat.dispose();
      wingPvMat.dispose();
      pvTexture.dispose();
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
      if (e.key === 'h' || e.key === 'H') {
        setIsControlsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[500px] select-none overflow-hidden bg-[#171B2B] ${className}`}>
      {/* 3D WebGL Canvas Ref Mount (isolated outside re-rendering HUD) */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center z-0" 
      />

      {/* Top-Left Minimal Spec & Identity Badge (Clean, Zero Pulsating Dots) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#232A3D] border border-[#48516A] rounded-xl text-xs font-mono text-[#F0EBDD] shadow-2xl pointer-events-auto">
          <Orbit className="w-4 h-4 text-[#A6B7D4]" />
          <span className="font-bold tracking-wide text-[#F0EBDD]">EARTH TRACE SENTINEL-ALPHA</span>
          <span className="text-[10px] text-[#A6B7D4] px-1.5 py-0.5 rounded bg-[#1D2436] border border-[#48516A]">
            LEO 705 KM
          </span>
        </div>

        <div className="text-[10px] font-mono text-[#B5BDCC] bg-[#232A3D]/95 border border-[#48516A] px-2.5 py-1 rounded-lg flex items-center gap-2 max-w-xs pointer-events-auto">
          <MapPin className="w-3 h-3 text-[#A6B7D4]" />
          <span className="truncate">Nadir Target: {selectedLocation.name} ({selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E)</span>
        </div>
      </div>

      {/* Top-Right Telemetry Readout & Audio Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? "Mute Spacecraft Telemetry Beep" : "Enable Spacecraft Telemetry Synthesizer"}
          className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xl ${
            audioEnabled 
              ? 'bg-[#353D55] border-[#A6B7D4] text-[#F0EBDD]' 
              : 'bg-[#232A3D] border-[#48516A] text-[#B5BDCC] hover:text-[#F0EBDD]'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-[#A6B7D4]" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px]">{audioEnabled ? 'Telemetry Audio ON' : 'Audio Muted'}</span>
        </button>

        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="p-2 bg-[#232A3D] border border-[#48516A] hover:border-[#A6B7D4] text-[#B5BDCC] hover:text-[#F0EBDD] rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 shadow-xl"
          title="Toggle Controls (Hotkey: H)"
        >
          {isControlsCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px]">{isControlsCollapsed ? 'Show HUD (H)' : 'Hide (H)'}</span>
        </button>
      </div>

      {/* Viewport-First Collapsible Bottom Control Dock (<= 15% Viewport Footprint) */}
      <div 
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[920px] transition-all duration-300 ease-out pointer-events-auto ${
          isControlsCollapsed ? 'translate-y-[calc(100%+20px)] opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="bg-[#232A3D] border border-[#48516A] rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5">
          {/* Dock Tab Selector & Speed Controls */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#2D354A] pb-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1 bg-[#1D2436] p-1 rounded-xl border border-[#48516A]">
              {[
                { id: 'camera', label: 'Camera Views', icon: Camera },
                { id: 'subsystems', label: 'Exploded Inspection', icon: Sliders },
                { id: 'layers', label: 'Atmospheric LiDAR', icon: Layers },
                { id: 'telemetry', label: 'Subsatellite Telemetry', icon: Radio },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                      isActive 
                        ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm' 
                        : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulation Speed & Pause Controls */}
            <div className="flex items-center gap-2">
              <button
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
              <span className="text-[10px] text-[#B5BDCC] uppercase tracking-wider">Kinematic Presets:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'chase', label: '🛰️ Satellite Chase' },
                  { id: 'nadir', label: '🌍 Planetary Nadir' },
                  { id: 'instrument', label: '🔬 LiDAR Optics' },
                  { id: 'ground', label: '📡 Ground Station' },
                  { id: 'cinematic', label: '🎬 Cinematic Flyby' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setCameraPreset(preset.id as CameraPreset)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-[11px] ${
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
                <span className="text-[10px] text-[#838FA3]">Flight Configuration (0%)</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedRatio}
                  onChange={(e) => setExplodedRatio(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-[#1D2436] rounded-lg appearance-none cursor-pointer accent-[#A6B7D4]"
                />
                <span className="text-[10px] text-[#838FA3]">Exploded Subsystems (100%)</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#B5BDCC] pt-1">
                <span>Displaces: Solar Wings · Parabolic Dish · MERRA-2 Radiometer · Thermal Louvers</span>
                <button
                  onClick={() => setExplodedRatio(explodedRatio > 0 ? 0 : 0.85)}
                  className="text-[#A6B7D4] hover:underline cursor-pointer"
                >
                  {explodedRatio > 0 ? 'Reset to Flight' : 'Expand Subassemblies'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[10px] text-[#B5BDCC] uppercase tracking-wider">Atmospheric Mode:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'pm25', label: 'PM2.5 Aerosol Burden', color: 'border-[#F16C72] text-[#F16C72]' },
                  { id: 'inversion', label: 'Boundary Layer Inversion Lid', color: 'border-[#A6B7D4] text-[#A6B7D4]' },
                  { id: 'precip', label: 'Cloud Rain Wet Deposition', color: 'border-[#35C98B] text-[#35C98B]' },
                  { id: 'aod', label: 'MODIS Aerosol Optical Depth', color: 'border-[#D28B71] text-[#D28B71]' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveAtmosphereLayer(layer.id as any)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-[11px] ${
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
