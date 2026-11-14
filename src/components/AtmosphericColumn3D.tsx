import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Wind, CloudRain, Thermometer, Activity, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AtmosphericColumn3DProps {
  initialWindSpeed?: number;
  initialInversionStrength?: number;
  className?: string;
}

export default function AtmosphericColumn3D({
  initialWindSpeed = 2.4,
  initialInversionStrength = 8.5,
  className = ''
}: AtmosphericColumn3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interactive controls
  const [windSpeed, setWindSpeed] = useState<number>(initialWindSpeed); // m/s
  const [pblHeightMeters, setPblHeightMeters] = useState<number>(450); // 200m - 2000m
  const [inversionStrength, setInversionStrength] = useState<number>(initialInversionStrength); // °C thermal gap
  const [isRaining, setIsRaining] = useState<boolean>(false);

  // Derived physics
  const ventilationCoeff = Math.round(pblHeightMeters * windSpeed); // m²/s
  const isStagnant = ventilationCoeff < 2000;
  const estimatedPM25 = Math.max(8, Math.round(
    (isRaining ? 18 : 65) * 
    (3.5 / Math.max(1, windSpeed)) * 
    (800 / Math.max(250, pblHeightMeters)) * 
    (1 + inversionStrength * 0.04)
  ));

  // Mutable refs for Three.js render loop to avoid full scene recreation on slider drag
  const paramsRef = useRef({
    windSpeed,
    pblHeightMeters,
    inversionStrength,
    isRaining
  });

  useEffect(() => {
    paramsRef.current = { windSpeed, pblHeightMeters, inversionStrength, isRaining };
  }, [windSpeed, pblHeightMeters, inversionStrength, isRaining]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090E, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(4.5, 3.8, 5.8);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Group
    const columnGroup = new THREE.Group();
    scene.add(columnGroup);

    // 2. Ground Terrain Base (Surface Level)
    const groundGeo = new THREE.BoxGeometry(4.0, 0.2, 4.0);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.85,
      metalness: 0.1
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.1;
    columnGroup.add(groundMesh);

    // Grid on ground
    const gridHelper = new THREE.GridHelper(4.0, 16, 0x06B6D4, 0x1E293B);
    gridHelper.position.y = 0.01;
    columnGroup.add(gridHelper);

    // 3. Vertical Height Gauge Markers (0m to 2000m)
    const markerLinesGroup = new THREE.Group();
    columnGroup.add(markerLinesGroup);

    // Column Bounding Wireframe
    const boxWireGeo = new THREE.BoxGeometry(4.0, 3.5, 4.0);
    const boxWireMat = new THREE.MeshBasicMaterial({
      color: 0x1E293B,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const boxWire = new THREE.Mesh(boxWireGeo, boxWireMat);
    boxWire.position.y = 1.75;
    columnGroup.add(boxWire);

    // 4. Dynamic Planetary Boundary Layer (PBL) Inversion Mesh Ceiling
    const pblCeilingGeo = new THREE.PlaneGeometry(3.9, 3.9);
    const pblCeilingMat = new THREE.MeshStandardMaterial({
      color: 0xEC4899,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const pblCeiling = new THREE.Mesh(pblCeilingGeo, pblCeilingMat);
    pblCeiling.rotation.x = Math.PI / 2;
    columnGroup.add(pblCeiling);

    // 5. Inversion Air Layer Volume (trapped volume)
    const inversionVolGeo = new THREE.BoxGeometry(3.9, 1.0, 3.9);
    const inversionVolMat = new THREE.MeshBasicMaterial({
      color: 0xF43F5E,
      transparent: true,
      opacity: 0.12
    });
    const inversionVolume = new THREE.Mesh(inversionVolGeo, inversionVolMat);
    columnGroup.add(inversionVolume);

    // 6. PM2.5 Aerosol Particle Cloud (1,500 particles)
    const particleCount = 1500;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 3.8;
      particlePositions[i * 3 + 1] = Math.random() * 0.8; // start low near ground
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 3.8;

      particleVelocities[i * 3] = (Math.random() * 0.02 + 0.01);
      particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // Color starts warm/smog (rose/amber)
      particleColors[i * 3] = 0.95;
      particleColors[i * 3 + 1] = 0.35;
      particleColors[i * 3 + 2] = 0.45;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    columnGroup.add(particleSystem);

    // 7. Rain Washout Particles
    const rainCount = 400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 3.8;
      rainPositions[i * 3 + 1] = Math.random() * 3.5;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.8;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38BDF8,
      size: 0.04,
      transparent: true,
      opacity: 0.6
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = false;
    columnGroup.add(rainSystem);

    // 8. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x06B6D4, 1.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    // Mouse Orbit Controls (simple rotation on drag)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      columnGroup.rotation.y += deltaX * 0.008;
      columnGroup.rotation.x = Math.max(-0.2, Math.min(0.6, columnGroup.rotation.x + deltaY * 0.005));
    };

    const onMouseUp = () => { isDragging = false; };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentParams = paramsRef.current;

      // Calculate 3D height scale: 200m -> 0.4 units, 2000m -> 3.2 units
      const targetHeight = (currentParams.pblHeightMeters / 2000) * 3.2;
      pblCeiling.position.y = targetHeight;

      // Update volume mesh
      inversionVolume.position.y = targetHeight / 2;
      inversionVolume.scale.y = Math.max(0.01, targetHeight);

      // Color of inversion ceiling depends on stagnation
      const isSevere = currentParams.pblHeightMeters < 500 && currentParams.windSpeed < 3.0;
      (pblCeiling.material as THREE.MeshStandardMaterial).color.set(isSevere ? 0xF43F5E : 0x06B6D4);

      // Rain animation
      rainSystem.visible = currentParams.isRaining;
      if (currentParams.isRaining) {
        const rPos = rainPositions;
        for (let i = 0; i < rainCount; i++) {
          rPos[i * 3 + 1] -= delta * 8.0;
          if (rPos[i * 3 + 1] < 0) {
            rPos[i * 3 + 1] = 3.5;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // PM2.5 Particle Physics: advection, boundary layer confinement, and dispersion
      const pos = particlePositions;
      const col = particleColors;
      const windFactor = currentParams.windSpeed * 0.015;

      for (let i = 0; i < particleCount; i++) {
        // Horizontal wind blow along X axis
        pos[i * 3] += windFactor;

        // Wrap around when blowing out of column
        if (pos[i * 3] > 2.0) {
          pos[i * 3] = -2.0;
          pos[i * 3 + 1] = Math.random() * (targetHeight * 0.8);
          pos[i * 3 + 2] = (Math.random() - 0.5) * 3.8;
        }

        // Vertical confinement: particles bounce or stay under the PBL inversion cap
        pos[i * 3 + 1] += (Math.random() - 0.5) * 0.012;
        if (pos[i * 3 + 1] > targetHeight) {
          pos[i * 3 + 1] = targetHeight - 0.05;
        }
        if (pos[i * 3 + 1] < 0.05) {
          pos[i * 3 + 1] = 0.05;
        }

        // Particle color: Red/Amber if trapped in low layer, Cyan/Blue if clean/dispersed
        if (isSevere || pos[i * 3 + 1] < 0.4) {
          col[i * 3] = 0.98;
          col[i * 3 + 1] = 0.28;
          col[i * 3 + 2] = 0.38; // Red/Pink high particulate smog
        } else {
          col[i * 3] = 0.15;
          col[i * 3 + 1] = 0.85;
          col[i * 3 + 2] = 0.95; // Cyan clean ventilation
        }
      }

      particleGeo.attributes.position.needsUpdate = true;
      particleGeo.attributes.color.needsUpdate = true;

      // Slow gentle scene rotation when idle
      if (!isDragging) {
        columnGroup.rotation.y += 0.0015;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      groundGeo.dispose();
      groundMat.dispose();
      boxWireGeo.dispose();
      boxWireMat.dispose();
      pblCeilingGeo.dispose();
      pblCeilingMat.dispose();
      inversionVolGeo.dispose();
      inversionVolMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      rainGeo.dispose();
      rainMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`bg-[#0B0E17] border border-[#1E293B] rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* 3D Viewport Column */}
      <div className="relative flex-1 min-h-[380px] bg-[#07090E] rounded-xl border border-[#1E293B] overflow-hidden select-none">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Viewport HUD Overlays */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0B0E17]/90 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300 backdrop-blur">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D Atmospheric Boundary Layer Simulator</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-[#1E293B]">
            PBL Mixing Height: {pblHeightMeters}m · Wind: {windSpeed} m/s
          </div>
        </div>

        {/* Live Computed Ventilation Status Pill */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className={`px-2.5 py-1 rounded-lg text-xs font-mono border backdrop-blur flex items-center gap-1.5 ${
            isStagnant 
              ? 'bg-rose-950/80 border-rose-800 text-rose-300' 
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isStagnant ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            <span>Ventilation Coeff Vc: {ventilationCoeff.toLocaleString()} m²/s ({isStagnant ? 'Stagnant Smog Trap' : 'Clean Dispersion'})</span>
          </div>

          <div className="px-2.5 py-1 bg-slate-950/80 border border-[#1E293B] rounded-lg text-xs font-mono text-white">
            Estimated PM2.5: <strong className={estimatedPM25 > 35 ? 'text-rose-400' : 'text-emerald-400'}>{estimatedPM25} µg/m³</strong>
          </div>
        </div>
      </div>

      {/* Physics Control Deck */}
      <div className="w-full lg:w-80 space-y-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">Atmospheric Physics Deck</div>
            <h3 className="text-base font-bold text-white mt-0.5">Boundary Layer & Scavenging</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Adjust meteorological forcing parameters to see how nocturnal temperature inversions trap particulate matter close to breathing level.
            </p>
          </div>

          {/* Slider 1: Wind Speed (WS10M) */}
          <div className="space-y-1.5 bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind Speed (WS10M)
              </span>
              <span className="font-mono text-cyan-400 font-bold">{windSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.1"
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5 (Calm / Trap)</span>
              <span>12.0 (High Gale)</span>
            </div>
          </div>

          {/* Slider 2: Planetary Boundary Layer Height */}
          <div className="space-y-1.5 bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Mixing Layer (PBLH)
              </span>
              <span className="font-mono text-amber-400 font-bold">{pblHeightMeters} m</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={pblHeightMeters}
              onChange={(e) => setPblHeightMeters(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>200m (Winter Night)</span>
              <span>2000m (Day Convective)</span>
            </div>
          </div>

          {/* Slider 3: Inversion Thermal Gradient */}
          <div className="space-y-1.5 bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Inversion Strength (ΔT)</span>
              <span className="font-mono text-rose-400 font-bold">+{inversionStrength.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="15.0"
              step="0.5"
              value={inversionStrength}
              onChange={(e) => setInversionStrength(parseFloat(e.target.value))}
              className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0°C (Neutral)</span>
              <span>+15°C (Severe Inversion)</span>
            </div>
          </div>

          {/* Toggle: Precipitation Wet Scavenging */}
          <button
            onClick={() => setIsRaining(!isRaining)}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isRaining 
                ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-md shadow-blue-900/30' 
                : 'bg-[#07090E] text-slate-300 border-[#1E293B] hover:border-slate-600'
            }`}
          >
            <CloudRain className={`w-4 h-4 ${isRaining ? 'text-blue-400 animate-bounce' : 'text-slate-500'}`} />
            <span>{isRaining ? 'Precipitation Scavenging ACTIVE' : 'Enable Rainfall Scavenging'}</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-[#1E293B] space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-slate-500">Quick Environmental Profiles:</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setWindSpeed(1.2);
                setPblHeightMeters(300);
                setInversionStrength(12.0);
                setIsRaining(false);
              }}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] text-rose-300 rounded border border-rose-900/40 text-left font-mono"
            >
              Winter Smog Trap
            </button>
            <button
              onClick={() => {
                setWindSpeed(6.5);
                setPblHeightMeters(1600);
                setInversionStrength(1.0);
                setIsRaining(true);
              }}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] text-cyan-300 rounded border border-cyan-900/40 text-left font-mono"
            >
              Monsoon Washout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
