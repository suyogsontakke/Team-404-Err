import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PRESET_LOCATIONS, PresetLocation } from '../lib/nasaPowerService';
import { Globe, RotateCw, MapPin, AlertCircle } from 'lucide-react';

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
      // 1. Initial dimensions with safe fallbacks
      const getW = () => Math.max(container.clientWidth || container.parentElement?.clientWidth || window.innerWidth || 800, 320);
      const getH = () => Math.max(container.clientHeight || container.parentElement?.clientHeight || 500, 350);

      let width = getW();
      let height = getH();

      // 2. Scene, Camera, Renderer
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
      renderer.toneMappingExposure = 1.15;

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();

      // Clear any prior canvas child nodes before appending
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Root Globe Group
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // 3. Earth Sphere with High-Res Procedural Canvas Texture
      const earthRadius = 1.70; // Optimized radius so full sphere fits centered without clipping

      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Ocean deep obsidian blue
        ctx.fillStyle = '#060B18';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
        ctx.lineWidth = 1;
        for (let lat = -80; lat <= 80; lat += 20) {
          const y = ((90 - lat) / 180) * canvas.height;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        for (let lon = -180; lon <= 180; lon += 30) {
          const x = ((lon + 180) / 360) * canvas.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        // Procedural continent landmasses
        const drawContinent = (cx: number, cy: number, rx: number, ry: number) => {
          ctx.fillStyle = '#112944';
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        };

        // Continents
        drawContinent(canvas.width * 0.72, canvas.height * 0.40, 240, 150); // Asia / India
        drawContinent(canvas.width * 0.52, canvas.height * 0.55, 130, 190); // Africa
        drawContinent(canvas.width * 0.52, canvas.height * 0.30, 110, 70);  // Europe
        drawContinent(canvas.width * 0.22, canvas.height * 0.32, 190, 120); // North America
        drawContinent(canvas.width * 0.30, canvas.height * 0.68, 100, 170); // South America
        drawContinent(canvas.width * 0.85, canvas.height * 0.72, 90, 70);   // Australia
      }

      const earthTexture = new THREE.CanvasTexture(canvas);
      earthTexture.colorSpace = THREE.SRGBColorSpace;

      const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 0.65,
        metalness: 0.2,
        emissive: new THREE.Color(0x020817),
        emissiveIntensity: 0.8
      });
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);
      globeGroup.add(earthMesh);

      // 4. Glowing Atmosphere Halo
      const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.045, 64, 64);
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
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
            gl_FragColor = vec4(0.02, 0.75, 0.95, 1.0) * intensity * 1.8;
          }
        `
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      globeGroup.add(atmoMesh);

      // 5. Cloud Swirl Wireframe Layer
      const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.015, 48, 48);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0x67E8F9,
        transparent: true,
        opacity: 0.18,
        wireframe: true,
        roughness: 1.0
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      globeGroup.add(cloudMesh);

      // 6. NASA Satellite Orbit Tracks
      const satGroup = new THREE.Group();
      globeGroup.add(satGroup);

      const orbit1Curve = new THREE.EllipseCurve(0, 0, earthRadius * 1.25, earthRadius * 1.25, 0, 2 * Math.PI, false, 0);
      const orbit1Points = orbit1Curve.getPoints(64);
      const orbit1Geo = new THREE.BufferGeometry().setFromPoints(orbit1Points.map(p => new THREE.Vector3(p.x, 0, p.y)));
      const orbit1Mat = new THREE.LineBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.4 });
      const orbit1Line = new THREE.Line(orbit1Geo, orbit1Mat);
      orbit1Line.rotation.x = Math.PI / 2.8;
      orbit1Line.rotation.y = Math.PI / 6;
      satGroup.add(orbit1Line);

      const orbit2Curve = new THREE.EllipseCurve(0, 0, earthRadius * 1.32, earthRadius * 1.32, 0, 2 * Math.PI, false, 0);
      const orbit2Points = orbit2Curve.getPoints(64);
      const orbit2Geo = new THREE.BufferGeometry().setFromPoints(orbit2Points.map(p => new THREE.Vector3(p.x, 0, p.y)));
      const orbit2Mat = new THREE.LineBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.35 });
      const orbit2Line = new THREE.Line(orbit2Geo, orbit2Mat);
      orbit2Line.rotation.x = -Math.PI / 3.2;
      orbit2Line.rotation.z = Math.PI / 4;
      satGroup.add(orbit2Line);

      // Composite Procedural Satellites (Chassis Bus + Solar Wings + Sensor Dish)
      const createCompositeSatellite = (primaryColor: number, wingColor: number) => {
        const satRoot = new THREE.Group();

        // 1. Central Bus Chassis
        const busG = new THREE.BoxGeometry(0.08, 0.045, 0.09);
        const busM = new THREE.MeshStandardMaterial({
          color: primaryColor,
          metalness: 0.9,
          roughness: 0.2
        });
        const bus = new THREE.Mesh(busG, busM);
        satRoot.add(bus);

        // 2 & 3. Port and Starboard Solar Array Wings
        const wingG = new THREE.BoxGeometry(0.14, 0.005, 0.06);
        const wingM = new THREE.MeshStandardMaterial({
          color: wingColor,
          metalness: 0.85,
          roughness: 0.25
        });
        const portWing = new THREE.Mesh(wingG, wingM);
        portWing.position.x = 0.12;
        satRoot.add(portWing);

        const stbdWing = new THREE.Mesh(wingG, wingM);
        stbdWing.position.x = -0.12;
        satRoot.add(stbdWing);

        // 4. Sensor Aperture / Dish
        const dishG = new THREE.CylinderGeometry(0.02, 0.005, 0.025, 8);
        const dishM = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
        const dish = new THREE.Mesh(dishG, dishM);
        dish.position.y = -0.03;
        dish.rotation.x = Math.PI;
        satRoot.add(dish);

        return satRoot;
      };

      const sat1Mesh = createCompositeSatellite(0x06B6D4, 0x1E3A8A);
      satGroup.add(sat1Mesh);

      const sat2Mesh = createCompositeSatellite(0xF59E0B, 0x312E81);
      satGroup.add(sat2Mesh);

      // 7. Interactive Location Markers
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
        const pos = latLonToVector3(loc.lat, loc.lon, earthRadius * 1.008);

        const mGeo = new THREE.SphereGeometry(isNagpur ? 0.055 : 0.035, 16, 16);
        const mMat = new THREE.MeshBasicMaterial({ color: isNagpur ? 0x22D3EE : 0xF43F5E });
        const marker = new THREE.Mesh(mGeo, mMat);
        marker.position.copy(pos);
        markerGroup.add(marker);

        const ringGeo = new THREE.RingGeometry(0.035, isNagpur ? 0.08 : 0.06, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isNagpur ? 0x06B6D4 : 0xFB7185,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const pulseRing = new THREE.Mesh(ringGeo, ringMat);
        pulseRing.position.copy(pos.clone().multiplyScalar(1.002));
        pulseRing.lookAt(pos.clone().multiplyScalar(2));
        markerGroup.add(pulseRing);

        markerMeshes.push({ mesh: marker, pulseMesh: pulseRing, location: loc });
      });

      // 8. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0x67E8F9, 2.2);
      dirLight1.position.set(5, 4, 6);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x3B82F6, 1.2);
      dirLight2.position.set(-5, -2, -4);
      scene.add(dirLight2);

      // Orientation towards India / Asia
      globeGroup.rotation.y = -Math.PI * 0.65;
      globeGroup.rotation.x = 0.15;

      // 9. Interactive Controls (Mouse Drag Orbit & Wheel Zoom)
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

      // 10. ResizeObserver for robust layout re-measurement (debounced with requestAnimationFrame)
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

      // 11. Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        if (autoRotate && !isDragging) {
          globeGroup.rotation.y += 0.0022;
        }
        cloudMesh.rotation.y += 0.0008;

        const pulseScale = 1.0 + 0.35 * Math.sin(elapsed * 4);
        markerMeshes.forEach(m => {
          m.pulseMesh.scale.set(pulseScale, pulseScale, 1);
        });

        const sat1Angle = elapsed * 0.65;
        sat1Mesh.position.set(
          Math.cos(sat1Angle) * earthRadius * 1.25,
          Math.sin(sat1Angle) * 0.4,
          Math.sin(sat1Angle) * earthRadius * 1.25
        );

        const sat2Angle = -elapsed * 0.52 + 1.2;
        sat2Mesh.position.set(
          Math.sin(sat2Angle) * earthRadius * 1.32,
          Math.cos(sat2Angle) * earthRadius * 0.8,
          Math.cos(sat2Angle) * earthRadius * 1.1
        );

        renderer.render(scene, camera);
      };

      animate();

      // Cleanup
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
        orbit1Geo.dispose();
        orbit1Mat.dispose();
        orbit2Geo.dispose();
        orbit2Mat.dispose();

        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err: any) {
      console.error('Three.js Globe Initialization error:', err);
      setWebGlError(err.message || 'WebGL context could not be initialized in this browser environment.');
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
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#232A3D]/90 backdrop-blur border border-[#48516A] rounded-lg text-[11px] font-mono text-[#F0EBDD] shadow-lg">
          <Globe className="w-3.5 h-3.5 text-[#A6B7D4] animate-spin" style={{ animationDuration: '12s' }} />
          <span>3D NASA Atmospheric Globe · MERRA-2 Mesh</span>
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
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all flex items-center gap-1 font-mono cursor-pointer border ${
                  isSelected 
                    ? 'bg-[#A6B7D4] text-[#171B2B] font-bold border-[#A6B7D4] shadow-sm' 
                    : 'bg-[#232A3D]/95 text-[#B5BDCC] hover:text-[#F0EBDD] border-[#48516A] hover:border-[#64718A]'
                }`}
              >
                <MapPin className={`w-2.5 h-2.5 ${isSelected ? 'text-[#171B2B]' : 'text-[#A6B7D4]'}`} />
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="px-2 py-0.5 text-[10px] bg-[#232A3D]/95 border border-[#48516A] hover:border-[#64718A] text-[#B5BDCC] hover:text-[#F0EBDD] rounded-md transition-colors flex items-center gap-1 cursor-pointer font-mono"
        >
          <RotateCw className={`w-2.5 h-2.5 ${autoRotate ? 'text-[#A6B7D4] animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>{autoRotate ? 'Auto-Rotate ON' : 'Paused'}</span>
        </button>
      </div>
    </div>
  );
}
