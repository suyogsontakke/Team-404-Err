import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PRESET_LOCATIONS, PresetLocation } from '../lib/nasaPowerService';
import { Globe, RotateCw, MapPin, AlertCircle, Sparkles } from 'lucide-react';

interface AtmosphericGlobe3DProps {
  onSelectLocation?: (loc: PresetLocation) => void;
  selectedLocationName?: string;
  className?: string;
}

export default function AtmosphericGlobe3D({
  onSelectLocation,
  selectedLocationName = 'Nagpur',
  className = ''
}: AtmosphericGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let animationFrameId: number;
    let resizeObserver: ResizeObserver;

    try {
      const getW = () => Math.max(container.clientWidth || container.parentElement?.clientWidth || window.innerWidth || 800, 320);
      const getH = () => Math.max(container.clientHeight || container.parentElement?.clientHeight || 500, 350);

      let width = getW();
      let height = getH();

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5.0);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        powerPreference: 'high-performance' 
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
      pmrem.dispose();

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const earthRadius = 1.70;

      // 1. Cinematic Starfield Background Particle Field
      const starsCount = 450;
      const starsGeo = new THREE.BufferGeometry();
      const starsPos = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount * 3; i += 3) {
        starsPos[i] = (Math.random() - 0.5) * 30;
        starsPos[i + 1] = (Math.random() - 0.5) * 30;
        starsPos[i + 2] = (Math.random() - 0.5) * 30 - 10;
      }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
      const starsMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.04, transparent: true, opacity: 0.6 });
      const starField = new THREE.Points(starsGeo, starsMat);
      scene.add(starField);

      // 2. High-Fidelity Cinematic Earth Canvas Texture
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Deep cinematic ocean gradient with rich sapphire tones
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        oceanGrad.addColorStop(0, '#0284c7');
        oceanGrad.addColorStop(0.3, '#0369a1');
        oceanGrad.addColorStop(0.7, '#1d4ed8');
        oceanGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Polar ice caps (luminous white/cyan)
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, 85);
        ctx.rect(0, canvas.height - 85, canvas.width, 85);
        ctx.fill();

        // Cinematic 3D Landmasses with rich green & ochre gradients
        const drawCinematicLand = (cx: number, cy: number, rx: number, ry: number) => {
          // Soft atmospheric shadow
          ctx.fillStyle = 'rgba(3, 7, 18, 0.45)';
          ctx.beginPath();
          ctx.ellipse(cx + 15, cy + 15, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();

          // Base landmass gradient
          const landGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
          landGrad.addColorStop(0, '#4ade80');
          landGrad.addColorStop(0.6, '#16a34a');
          landGrad.addColorStop(1, '#14532d');
          ctx.fillStyle = landGrad;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();

          // Terrain elevation highlights
          ctx.fillStyle = '#86efac';
          for (let i = 0; i < 35; i++) {
            const ox = cx + (Math.random() - 0.5) * rx * 1.3;
            const oy = cy + (Math.random() - 0.5) * ry * 1.3;
            ctx.beginPath();
            ctx.arc(ox, oy, Math.random() * 18 + 5, 0, Math.PI * 2);
            ctx.fill();
          }
        };

        // Continents
        drawCinematicLand(canvas.width * 0.52, canvas.height * 0.55, 175, 250); // Africa
        drawCinematicLand(canvas.width * 0.73, canvas.height * 0.36, 320, 200); // Eurasia / India
        drawCinematicLand(canvas.width * 0.22, canvas.height * 0.32, 240, 160); // North America
        drawCinematicLand(canvas.width * 0.31, canvas.height * 0.70, 135, 210); // South America
        drawCinematicLand(canvas.width * 0.86, canvas.height * 0.75, 105, 85);  // Australia

        // Cinematic Cloud Swirls
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        const drawCloud = (x: number, y: number, w: number, h: number) => {
          ctx.beginPath();
          ctx.ellipse(x, y, w, h, Math.PI / 5, 0, Math.PI * 2);
          ctx.fill();
        };
        drawCloud(canvas.width * 0.20, canvas.height * 0.80, 200, 55);
        drawCloud(canvas.width * 0.60, canvas.height * 0.85, 240, 65);
        drawCloud(canvas.width * 0.35, canvas.height * 0.22, 280, 75);
        drawCloud(canvas.width * 0.82, canvas.height * 0.25, 210, 55);
      }

      const earthTexture = new THREE.CanvasTexture(canvas);
      earthTexture.colorSpace = THREE.SRGBColorSpace;

      const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 0.3,
        metalness: 0.15,
        bumpScale: 0.04
      });
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);
      globeGroup.add(earthMesh);

      // 3. Cinematic Volumetric Atmosphere Halo (Additive Scattering)
      const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.06, 64, 64);
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
            float intensity = pow(0.52 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.1, 0.7, 1.0, 1.0) * intensity * 2.4;
          }
        `
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      globeGroup.add(atmoMesh);

      // 4. Cloud Mesh Layer
      const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.02, 48, 48);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.32,
        roughness: 0.8
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      globeGroup.add(cloudMesh);

      // 5. Cinematic Orbit Rings & Satellites
      const satGroup = new THREE.Group();
      globeGroup.add(satGroup);

      const orbitCurve = new THREE.EllipseCurve(0, 0, earthRadius * 1.28, earthRadius * 1.28, 0, 2 * Math.PI, false, 0);
      const orbitPoints = orbitCurve.getPoints(64);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.x = Math.PI / 3;
      orbitLine.rotation.y = Math.PI / 5;
      satGroup.add(orbitLine);

      const createSatellite = () => {
        const satRoot = new THREE.Group();
        const busG = new THREE.BoxGeometry(0.08, 0.04, 0.08);
        const busM = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 });
        satRoot.add(new THREE.Mesh(busG, busM));

        const wingG = new THREE.BoxGeometry(0.16, 0.004, 0.06);
        const wingM = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.2 });
        const wing1 = new THREE.Mesh(wingG, wingM);
        wing1.position.x = 0.13;
        satRoot.add(wing1);
        const wing2 = new THREE.Mesh(wingG, wingM);
        wing2.position.x = -0.13;
        satRoot.add(wing2);

        return satRoot;
      };

      const satelliteMesh = createSatellite();
      satGroup.add(satelliteMesh);

      // 6. Interactive Location Markers with Glowing Rings
      const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
      };

      const markerGroup = new THREE.Group();
      globeGroup.add(markerGroup);

      const markerMeshes: { mesh: THREE.Mesh; pulseMesh: THREE.Mesh; location: PresetLocation }[] = [];

      PRESET_LOCATIONS.forEach((loc) => {
        const isNagpur = loc.name === 'Nagpur';
        const pos = latLonToVector3(loc.lat, loc.lon, earthRadius * 1.01);

        const mGeo = new THREE.SphereGeometry(isNagpur ? 0.055 : 0.038, 16, 16);
        const mMat = new THREE.MeshBasicMaterial({ color: isNagpur ? 0x38bdf8 : 0xf43f5e });
        const marker = new THREE.Mesh(mGeo, mMat);
        marker.position.copy(pos);
        markerGroup.add(marker);

        const ringGeo = new THREE.RingGeometry(0.04, isNagpur ? 0.095 : 0.075, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isNagpur ? 0x38bdf8 : 0xfb7185,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const pulseRing = new THREE.Mesh(ringGeo, ringMat);
        pulseRing.position.copy(pos.clone().multiplyScalar(1.002));
        pulseRing.lookAt(pos.clone().multiplyScalar(2));
        markerGroup.add(pulseRing);

        markerMeshes.push({ mesh: marker, pulseMesh: pulseRing, location: loc });
      });

      // 7. Cinematic Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 3.2);
      mainLight.position.set(7, 5, 6);
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
      fillLight.position.set(-7, -4, -5);
      scene.add(fillLight);

      // Orientation centered on India / Asia / Africa
      globeGroup.rotation.y = -Math.PI * 0.45;
      globeGroup.rotation.x = 0.18;

      // Mouse Drag & Wheel Zoom
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

        globeGroup.rotation.y += deltaX * 0.006;
        globeGroup.rotation.x += deltaY * 0.006;
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        camera.position.z = Math.min(Math.max(camera.position.z + e.deltaY * 0.004, 3.5), 8.0);
      };

      const domElement = renderer.domElement;
      domElement.addEventListener('mousedown', onMouseDown);
      domElement.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

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

      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        if (autoRotate && !isDragging) {
          globeGroup.rotation.y += 0.0022;
        }
        cloudMesh.rotation.y += 0.0007;

        const pulseScale = 1.0 + 0.4 * Math.sin(elapsed * 4.5);
        markerMeshes.forEach(m => {
          m.pulseMesh.scale.set(pulseScale, pulseScale, 1);
        });

        const satAngle = elapsed * 0.65;
        satelliteMesh.position.set(
          Math.cos(satAngle) * earthRadius * 1.28,
          Math.sin(satAngle) * 0.45,
          Math.sin(satAngle) * earthRadius * 1.28
        );

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        cancelAnimationFrame(resizeRafId);
        resizeObserver?.disconnect();
        domElement.removeEventListener('mousedown', onMouseDown);
        domElement.removeEventListener('wheel', onWheel);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        earthGeo.dispose();
        earthMat.dispose();
        earthTexture.dispose();
        atmoGeo.dispose();
        atmoMat.dispose();
        cloudGeo.dispose();
        cloudMat.dispose();

        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err: any) {
      console.error('Three.js Cinematic Earth Globe error:', err);
      setWebGlError(err.message || 'WebGL context could not be initialized.');
    }
  }, [autoRotate]);

  if (webGlError) {
    return (
      <div className={`relative w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 bg-[#171B2B] border border-[#48516A] rounded-2xl text-center select-none ${className}`}>
        <AlertCircle className="w-10 h-10 text-[#F0B44D] mb-2 animate-bounce" />
        <h3 className="text-sm font-bold text-[#F0EBDD] font-mono uppercase tracking-wider mb-1">WebGL 3D Rendering Notice</h3>
        <p className="text-xs text-[#B5BDCC] max-w-md font-mono mb-4">{webGlError}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESET_LOCATIONS.slice(0, 5).map((loc) => (
            <button
              key={loc.name}
              onClick={() => onSelectLocation?.(loc)}
              className="px-3 py-1 bg-[#232A3D] hover:bg-[#353D55] text-[#F0EBDD] border border-[#48516A] rounded-lg text-xs font-mono transition-colors"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[380px] select-none flex flex-col justify-center items-center overflow-hidden ${className}`}>
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing flex items-center justify-center" />

      {/* Floating HUD Telemetry Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#171B2B]/90 backdrop-blur border border-[#38bdf8]/40 rounded-lg text-[11px] font-mono text-[#F0EBDD] shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
          <span>Cinematic 3D Earth · NASA Orbital View</span>
        </div>
      </div>

      {/* Quick Location Pills */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1">
          {PRESET_LOCATIONS.slice(0, 4).map((loc) => {
            const isSelected = loc.name === selectedLocationName;
            return (
              <button
                key={loc.name}
                onClick={() => onSelectLocation?.(loc)}
                className={`px-2.5 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 font-mono cursor-pointer border shadow-sm ${
                  isSelected 
                    ? 'bg-[#38bdf8] text-[#07090E] font-bold border-[#38bdf8]' 
                    : 'bg-[#171B2B]/95 text-[#B5BDCC] hover:text-[#F0EBDD] border-[#48516A] hover:border-[#38bdf8]/50'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-[#07090E]' : 'text-[#38bdf8]'}`} />
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="px-2.5 py-1 text-[10px] bg-[#171B2B]/95 border border-[#48516A] hover:border-[#38bdf8]/50 text-[#B5BDCC] hover:text-[#F0EBDD] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer font-mono shadow-sm"
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'text-[#38bdf8] animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>{autoRotate ? 'Auto-Rotate ON' : 'Paused'}</span>
        </button>
      </div>
    </div>
  );
}
