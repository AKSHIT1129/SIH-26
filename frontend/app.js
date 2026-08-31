document.addEventListener('DOMContentLoaded', () => {
  const twin = new DigitalTwin3D('digital-twin-container');
  const vcam = new VirtualCameraView('virtual-camera-container', twin.scene);
  const minimap = new TacticalMinimap('minimap-canvas');
  const hud = new EOIRTrackingHUD('camera-hud-canvas', vcam);
  const timeline = new EngineeringEventFeed('timeline-log-list');
  const telemetry = new TelemetryConsole(timeline);
  const net = new NetworkClient(twin, vcam, minimap, hud, telemetry, timeline);

  net.connect();
  setupOperatorEventListeners(net, twin, vcam, hud, telemetry, timeline);
});

function generateSatelliteMapTexture(mode = 'rgb') {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  if (mode === 'thermal') {
    ctx.fillStyle = '#080716';
    ctx.fillRect(0, 0, 2048, 2048);

    const oceanGrad = ctx.createLinearGradient(1300, 0, 2048, 2048);
    oceanGrad.addColorStop(0, '#0f172a');
    oceanGrad.addColorStop(1, '#020617');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 2048);

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1420, 0);
    ctx.bezierCurveTo(1360, 500, 1520, 1200, 1380, 2048);
    ctx.lineTo(0, 2048);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 90; i++) {
      const rx = Math.random() * 1350;
      const ry = Math.random() * 2048;
      ctx.fillStyle = i % 2 === 0 ? '#312e81' : '#3730a3';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 50 + Math.random() * 100, 35 + Math.random() * 70, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(160, 960, 1240, 130);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(780, 780, 480, 180);
    ctx.fillRect(920, 460, 200, 320);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(1024, 1024, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(1024, 1024, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(120, 180); ctx.lineTo(1320, 180); ctx.lineTo(1360, 1840); ctx.lineTo(120, 1840); ctx.closePath();
    ctx.stroke();

  } else if (mode === 'night') {
    ctx.fillStyle = '#020305';
    ctx.fillRect(0, 0, 2048, 2048);

    ctx.fillStyle = '#010103';
    ctx.fillRect(1380, 0, 668, 2048);

    ctx.fillStyle = '#050609';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(1420, 0);
    ctx.bezierCurveTo(1360, 500, 1520, 1200, 1380, 2048);
    ctx.lineTo(0, 2048); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#080a0e';
    ctx.fillRect(160, 960, 1240, 130);

    for (let x = 160; x <= 1400; x += 35) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.beginPath(); ctx.arc(x, 962, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, 1088, 3, 0, Math.PI * 2); ctx.fill();
    }

    for (let x = 180; x <= 1380; x += 45) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath(); ctx.arc(x, 1025, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    const lightGlow = ctx.createRadialGradient(1024, 1024, 20, 1024, 1024, 240);
    lightGlow.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    lightGlow.addColorStop(0.4, 'rgba(234, 179, 8, 0.25)');
    lightGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = lightGlow;
    ctx.beginPath(); ctx.arc(1024, 1024, 240, 0, Math.PI * 2); ctx.fill();

    for (let x = 140; x <= 1300; x += 50) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.beginPath(); ctx.arc(x, 180, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, 1840, 2.5, 0, Math.PI * 2); ctx.fill();
    }

  } else if (mode === 'sar') {
    ctx.fillStyle = '#0d0f13';
    ctx.fillRect(0, 0, 2048, 2048);

    ctx.fillStyle = '#040507';
    ctx.fillRect(1380, 0, 668, 2048);

    for (let i = 0; i < 500; i++) {
      const rx = Math.random() * 1350;
      const ry = Math.random() * 2048;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(rx, ry, Math.random() * 30, Math.random() * 20);
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(160, 960, 1240, 130);
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(780, 780, 480, 180);
    ctx.beginPath(); ctx.arc(1024, 1024, 150, 0, Math.PI * 2); ctx.fill();

  } else {
    const oceanGrad = ctx.createLinearGradient(1300, 0, 2048, 2048);
    oceanGrad.addColorStop(0, '#082538');
    oceanGrad.addColorStop(0.2, '#061a29');
    oceanGrad.addColorStop(0.6, '#04101a');
    oceanGrad.addColorStop(1, '#02080d');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 2048);

    const landGrad = ctx.createLinearGradient(0, 0, 1400, 2048);
    landGrad.addColorStop(0, '#152118');
    landGrad.addColorStop(0.35, '#1b2a1f');
    landGrad.addColorStop(0.75, '#17251c');
    landGrad.addColorStop(1, '#121c15');
    ctx.fillStyle = landGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1420, 0);
    ctx.bezierCurveTo(1360, 500, 1520, 1200, 1380, 2048);
    ctx.lineTo(0, 2048);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 52;
    ctx.beginPath();
    ctx.moveTo(1420, 0);
    ctx.bezierCurveTo(1360, 500, 1520, 1200, 1380, 2048);
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 28;
    ctx.stroke();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 18;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    for (let i = 0; i < 140; i++) {
      const rx = Math.random() * 1320;
      const ry = Math.random() * 2048;
      const rw = 60 + Math.random() * 140;
      const rh = 40 + Math.random() * 90;
      ctx.fillStyle = i % 3 === 0 ? '#102717' : (i % 3 === 1 ? '#091b0f' : '#18331e');
      ctx.beginPath();
      ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 40; i++) {
      const rx = 1020 + Math.random() * 340;
      const ry = Math.random() * 2048;
      ctx.fillStyle = 'rgba(217, 119, 6, 0.24)';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 50 + Math.random() * 80, 20 + Math.random() * 35, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#16171d';
    ctx.fillRect(160, 960, 1240, 130);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(160, 960, 1240, 130);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([45, 30]);
    ctx.beginPath();
    ctx.moveTo(180, 1025);
    ctx.lineTo(1380, 1025);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(10, 10, 12, 0.75)';
    ctx.fillRect(280, 985, 240, 80);
    ctx.fillRect(1040, 985, 240, 80);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px "Cinzel", "Times New Roman", serif';
    ctx.fillText('09', 240, 1038);
    ctx.fillText('27', 1280, 1038);

    ctx.fillStyle = '#1f2128';
    ctx.fillRect(780, 780, 480, 180);
    ctx.fillRect(920, 460, 200, 320);

    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(920, 1025);
    ctx.lineTo(920, 860);
    ctx.lineTo(1020, 860);
    ctx.lineTo(1020, 560);
    ctx.stroke();

    ctx.fillStyle = '#262830';
    ctx.beginPath();
    ctx.arc(1024, 1024, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const blastGrad = ctx.createRadialGradient(1024, 1024, 10, 1024, 1024, 110);
    blastGrad.addColorStop(0, '#09090b');
    blastGrad.addColorStop(0.6, '#18181b');
    blastGrad.addColorStop(1, '#262830');
    ctx.fillStyle = blastGrad;
    ctx.beginPath();
    ctx.arc(1024, 1024, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.arc(1024, 1024, 125, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#383940';
    ctx.fillRect(1000, 560, 48, 380);
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1000, 560, 48, 380);

    ctx.strokeStyle = '#24252a';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(120, 180);
    ctx.lineTo(1320, 180);
    ctx.lineTo(1360, 1840);
    ctx.lineTo(120, 1840);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 2048; x += 256) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
  }
  for (let y = 0; y < 2048; y += 256) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillText('13°43\'30"N [SDSC LAUNCH RANGE]', 40, 220);
  ctx.fillText('13°43\'00"N [PTM-01 OPTICAL BASE]', 40, 1000);
  ctx.fillText('13°42\'30"N [BAY OF BENGAL SHORE]', 40, 1800);
  ctx.fillText('80°13\'00"E [SRIHARIKOTA]', 240, 2020);
  ctx.fillText('80°13\'30"E [COASTAL LEO CORRIDOR]', 1000, 2020);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

class DigitalTwin3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth || 600;
    this.height = this.container.clientHeight || 450;
    this.cameraMode = 'free';
    this.sensorFilter = 'rgb';
    this.lastTargetPos = new THREE.Vector3(150, 100, 120);
    this.lastTargetVel = [0, 0, 0];
    this.currentLookTarget = new THREE.Vector3(0, 0, 38);
    this.anemometerRotors = [];
    this.oceanMesh = null;
    this.swayingTrees = [];
    this.windIntensity = 0.5;
    this.isOccludedVisual = false;
    this.clock = new THREE.Clock();
    this.targetFps = 60.0;
    this.frameInterval = 1000.0 / 60.0;
    this.lastRenderTime = 0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040508);
    this.scene.fog = new THREE.FogExp2(0x040508, 0.00022);

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 8000);
    this.camera.position.set(0, -380, 240);
    this.camera.up.set(0, 0, 1);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.01;
      this.controls.minDistance = 15;
      this.controls.maxDistance = 2600;
      this.controls.target.set(0, 0, 38);
      this.controls.update();
    }

    this.flightHistory = [];
    this.maxHistoryPoints = 160;

    this.initSkyAndStars();
    this.initSpaceAtmosphere();
    this.initLighting();
    this.initSatelliteGround();
    this.initOceanWaves();
    this.initRoadNetwork();
    this.initWindStreamParticles();
    this.initVegetationAndTrees();
    this.initRangeInfrastructure();
    this.initLaunchVehicle();
    this.initCryogenicTanks();
    this.initAssemblyHighBay();
    this.initMetStation();
    this.initGroundVehicles();
    this.initStreetLamps();
    this.initGroundTerminal();
    this.initSpacecraftSatellite();
    this.initOpticalLaser();
    this.initFlightTrail();
    this.initOcclusionClouds();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initSkyAndStars() {
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3800;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = Math.abs(r * Math.cos(phi)) + 120;

      const starType = Math.random();
      if (starType > 0.8) {
        starColors[i] = 0.6; starColors[i + 1] = 0.85; starColors[i + 2] = 1.0;
      } else if (starType > 0.6) {
        starColors[i] = 1.0; starColors[i + 1] = 0.9; starColors[i + 2] = 0.7;
      } else {
        starColors[i] = 1.0; starColors[i + 1] = 1.0; starColors[i + 2] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);
  }

  initSpaceAtmosphere() {
    const earthRadius = 3200;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 4);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x050c18,
      wireframe: false
    });
    this.curvedEarthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.curvedEarthMesh.position.set(0, 0, -earthRadius + 2.0);
    this.scene.add(this.curvedEarthMesh);

    const haloGeo = new THREE.RingGeometry(earthRadius * 0.98, earthRadius * 1.06, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.atmosphereLimb = new THREE.Mesh(haloGeo, haloMat);
    this.atmosphereLimb.position.set(0, 1800, 160);
    this.atmosphereLimb.rotation.x = Math.PI / 3;
    this.scene.add(this.atmosphereLimb);
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 3.6);
    this.sunLight.position.set(340, -320, 520);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1600;
    this.sunLight.shadow.camera.left = -450;
    this.sunLight.shadow.camera.right = 450;
    this.sunLight.shadow.camera.top = 450;
    this.sunLight.shadow.camera.bottom = -450;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0x71717a, 1.4);
    this.rimLight.position.set(-280, 280, 220);
    this.scene.add(this.rimLight);

    this.terminalLight = new THREE.PointLight(0xffffff, 3.2, 190);
    this.terminalLight.position.set(0, 0, 38);
    this.scene.add(this.terminalLight);

    this.uavLight = new THREE.PointLight(0xffffff, 3.8, 150);
    this.scene.add(this.uavLight);
  }

  initSatelliteGround() {
    this.satTexture = generateSatelliteMapTexture('rgb');
    
    // Spaceport Island Landmass (Solid Land spanning from x = -800 to x = +380)
    const groundGeo = new THREE.PlaneGeometry(1200, 1600, 48, 48);
    this.groundMat = new THREE.MeshStandardMaterial({
      map: this.satTexture,
      roughness: 0.82,
      metalness: 0.18
    });
    this.groundMesh = new THREE.Mesh(groundGeo, this.groundMat);
    this.groundMesh.position.set(-220, 0, 0);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Sandy Shoreline Beach Strip (Transitions from land at x = 380 down to ocean at x = 440)
    const beachGeo = new THREE.PlaneGeometry(60, 1600, 16, 32);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.92,
      metalness: 0.05
    });
    const beachMesh = new THREE.Mesh(beachGeo, beachMat);
    beachMesh.position.set(410, 0, -0.4);
    beachMesh.rotation.y = 0.04;
    beachMesh.receiveShadow = true;
    this.scene.add(beachMesh);

    // Ground Station Optical Terminal Pad
    const padGeo = new THREE.CylinderGeometry(52, 56, 3.2, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x22232a, roughness: 0.7, metalness: 0.3 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(0, 0, 1.6);
    pad.receiveShadow = true;
    this.scene.add(pad);

    // Rocket Launch Pad (PSLV / GSLV Complex) - Massive reinforced dry concrete flame trench pad
    const rocketPadGeo = new THREE.BoxGeometry(84, 84, 4.5);
    const rocketPadMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8, metalness: 0.3 });
    const rocketPad = new THREE.Mesh(rocketPadGeo, rocketPadMat);
    rocketPad.position.set(160, -220, 2.25);
    rocketPad.receiveShadow = true;
    this.scene.add(rocketPad);

    [100, 200, 300].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.8, r + 0.8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0xffffff : 0x71717a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: idx === 1 ? 0.85 : 0.35
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = 0.2;
      this.scene.add(ring);
    });
  }

  initOceanWaves() {
    // Vibrant tropical azure blue ocean (Bay of Bengal) strictly east of the beach at x >= 440m
    const oceanGeo = new THREE.PlaneGeometry(900, 1800, 48, 48);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant tropical azure ocean blue
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.94
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.set(890, 0, -1.2);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);

    // Dynamic Sparkling Surf Foam along the golden coastline
    const surfGeo = new THREE.PlaneGeometry(24, 1600, 12, 32);
    const surfMat = new THREE.MeshStandardMaterial({
      color: 0xf0fdf4,
      transparent: true,
      opacity: 0.75,
      roughness: 0.2
    });
    this.surfMesh = new THREE.Mesh(surfGeo, surfMat);
    this.surfMesh.position.set(434, 0, -0.5);
    this.scene.add(this.surfMesh);
  }

  initRoadNetwork() {
    this.roadGroup = new THREE.Group();

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.85,
      metalness: 0.15
    });

    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      roughness: 0.7,
      metalness: 0.2
    });

    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf9fafb });

    const createRoadSegment = (x, y, w, h, hasCenterLine = true, isVertical = false) => {
      const road = new THREE.Group();
      road.position.set(x, y, 0.15);

      const rMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), asphaltMat);
      rMesh.receiveShadow = true;
      road.add(rMesh);

      // Painted markings
      if (hasCenterLine) {
        if (!isVertical) {
          const cLine = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.45), yellowLineMat);
          cLine.position.z = 0.04;
          road.add(cLine);
        } else {
          const cLine = new THREE.Mesh(new THREE.PlaneGeometry(0.45, h), yellowLineMat);
          cLine.position.z = 0.04;
          road.add(cLine);
        }
      }

      return road;
    };

    // 1. Main East-West Spaceport Arterial Highway (width 16m, length 780m)
    this.roadGroup.add(createRoadSegment(-80, 0, 780, 16, true, false));

    // 2. Launch Complex 1 & 2 Access Boulevard (connecting Main Road to Launch Pad at 160, -220)
    this.roadGroup.add(createRoadSegment(160, -110, 16, 220, true, true));

    // 3. Cryogenic Propellant Storage Access Road (connecting Main Road to Cryo tanks at -140, -220)
    this.roadGroup.add(createRoadSegment(-140, -110, 14, 220, true, true));

    // 4. Southern Perimeter Connector Road (connecting Cryo farm to Launch Pad at y = -220)
    this.roadGroup.add(createRoadSegment(10, -220, 300, 14, true, false));

    // 5. Heavy Mobile Crawler Track (Dual Concrete Track from VAB High Bay 240, -60 to Launch Pad 160, -220)
    const crawlerTrackMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8 });

    const crawlerGeo = new THREE.BoxGeometry(22, 180, 0.8);
    const crawlerBed = new THREE.Mesh(crawlerGeo, crawlerTrackMat);
    crawlerBed.position.set(200, -140, 0.4);
    crawlerBed.rotation.z = 0.45;
    this.roadGroup.add(crawlerBed);

    [-6, 6].forEach(offRail => {
      const railGeo = new THREE.BoxGeometry(0.8, 180, 0.4);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(200 + offRail * Math.cos(0.45), -140 - offRail * Math.sin(0.45), 0.9);
      rail.rotation.z = 0.45;
      this.roadGroup.add(rail);
    });

    // 6. North Range Highway (connecting Ground Terminal to DSN radar -200, 170 and Met Station -60, 240)
    this.roadGroup.add(createRoadSegment(-60, 120, 14, 240, true, true));
    this.roadGroup.add(createRoadSegment(-130, 170, 140, 14, true, false));

    // 7. Security Checkpoint Road Aprons & Parking Bays
    const parkingGeo = new THREE.PlaneGeometry(64, 38);
    const parking = new THREE.Mesh(parkingGeo, asphaltMat);
    parking.position.set(160, 120, 0.15);
    parking.receiveShadow = true;
    this.roadGroup.add(parking);

    // Parking bay stripes
    for (let p = -24; p <= 24; p += 8) {
      const stripeGeo = new THREE.PlaneGeometry(0.3, 14);
      const stripe = new THREE.Mesh(stripeGeo, whiteLineMat);
      stripe.position.set(160 + p, 120, 0.18);
      this.roadGroup.add(stripe);
    }

    this.scene.add(this.roadGroup);
  }

  initWindStreamParticles() {
    this.windParticleCount = 200;
    const windGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.windParticleCount * 6); // 2 vertices per line segment

    for (let i = 0; i < this.windParticleCount; i++) {
      const x = -400 + Math.random() * 800;
      const y = -400 + Math.random() * 800;
      const z = 8 + Math.random() * 140;
      const streakLen = 8 + Math.random() * 14;

      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x + streakLen * 0.86;
      positions[i * 6 + 4] = y + streakLen * 0.5;
      positions[i * 6 + 5] = z + (Math.random() * 1.5 - 0.75);
    }

    windGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.windStreakMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      linewidth: 1.5
    });

    this.windStreamLines = new THREE.LineSegments(windGeo, this.windStreakMat);
    this.scene.add(this.windStreamLines);
  }

  initVegetationAndTrees() {
    this.treesGroup = new THREE.Group();
    this.swayingTrees = [];

    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.88 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.42, side: THREE.DoubleSide });
    const palmFrondLightMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.38, side: THREE.DoubleSide });
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    const casuarinaTrunkMat = new THREE.MeshStandardMaterial({ color: 0x38383c, roughness: 0.9 });
    const casuarinaFoliageMat1 = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.65 });
    const casuarinaFoliageMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });

    const broadleafTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2e1e, roughness: 0.85 });
    const broadleafFoliageMat1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.55 });
    const broadleafFoliageMat2 = new THREE.MeshStandardMaterial({ color: 0x1e824c, roughness: 0.55 });
    const broadleafFoliageMat3 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });

    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    const createRealisticPalmTree = (x, y, scale = 1.0, tilt = 0.12, rotZ = 0) => {
      const palm = new THREE.Group();
      palm.position.set(x, y, 0);

      const segments = 6;
      const totalH = 22 * scale;
      const segH = totalH / segments;
      let curZ = 0;
      let curX = 0;

      for (let s = 0; s < segments; s++) {
        const botR = (0.95 - s * 0.08) * scale;
        const topR = (0.90 - s * 0.08) * scale;
        const segGeo = new THREE.CylinderGeometry(topR, botR, segH, 8);
        const segMesh = new THREE.Mesh(segGeo, palmTrunkMat);
        const offX = Math.sin(tilt) * (s * 0.65);
        segMesh.position.set(offX, 0, curZ + segH / 2);
        segMesh.rotation.x = Math.PI / 2 + tilt * 0.6;
        segMesh.rotation.z = rotZ;
        segMesh.castShadow = true;
        segMesh.receiveShadow = true;
        palm.add(segMesh);

        curZ += segH * 0.95;
        curX = offX;
      }

      const crownGroup = new THREE.Group();
      crownGroup.position.set(curX, 0, curZ);

      const numFronds = 14;
      for (let i = 0; i < numFronds; i++) {
        const frondAngle = (i / numFronds) * Math.PI * 2 + rotZ;
        const frondMat = i % 2 === 0 ? palmFrondMat : palmFrondLightMat;

        const frondArchGroup = new THREE.Group();
        frondArchGroup.rotation.z = frondAngle;

        const mainStemGeo = new THREE.BoxGeometry(1.2 * scale, 9.5 * scale, 0.18 * scale);
        const mainStem = new THREE.Mesh(mainStemGeo, frondMat);
        mainStem.position.set(0, 4.5 * scale, -1.2 * scale);
        mainStem.rotation.x = 0.42;
        mainStem.castShadow = true;
        frondArchGroup.add(mainStem);

        const tipStemGeo = new THREE.BoxGeometry(0.9 * scale, 5.0 * scale, 0.14 * scale);
        const tipStem = new THREE.Mesh(tipStemGeo, frondMat);
        tipStem.position.set(0, 8.5 * scale, -3.2 * scale);
        tipStem.rotation.x = 0.85;
        tipStem.castShadow = true;
        frondArchGroup.add(tipStem);

        crownGroup.add(frondArchGroup);
      }

      [-0.5, 0, 0.5].forEach(offX => {
        const nutGeo = new THREE.SphereGeometry(0.7 * scale, 6, 6);
        const nut = new THREE.Mesh(nutGeo, coconutMat);
        nut.position.set(offX * scale, 0.3 * scale, -0.6 * scale);
        crownGroup.add(nut);
      });

      palm.add(crownGroup);
      this.swayingTrees.push({ target: crownGroup, phase: Math.random() * Math.PI * 2, type: 'palm' });
      this.swayingTrees.push({ target: palm, phase: Math.random() * Math.PI * 2, type: 'trunk' });

      return palm;
    };

    const createRealisticCasuarinaTree = (x, y, scale = 1.0) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, 0);

      const trunkH = 28 * scale;
      const trunkGeo = new THREE.CylinderGeometry(0.55 * scale, 1.25 * scale, trunkH, 8);
      const trunk = new THREE.Mesh(trunkGeo, casuarinaTrunkMat);
      trunk.rotation.x = Math.PI / 2;
      trunk.position.z = trunkH / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      const tiers = [
        { r: 5.4 * scale, h: 10.0 * scale, z: 13.0 * scale, mat: casuarinaFoliageMat1 },
        { r: 4.5 * scale, h: 9.0 * scale, z: 18.5 * scale, mat: casuarinaFoliageMat2 },
        { r: 3.4 * scale, h: 8.0 * scale, z: 23.5 * scale, mat: casuarinaFoliageMat1 },
        { r: 2.2 * scale, h: 7.0 * scale, z: 28.0 * scale, mat: casuarinaFoliageMat2 },
        { r: 1.2 * scale, h: 5.5 * scale, z: 31.5 * scale, mat: casuarinaFoliageMat1 }
      ];

      tiers.forEach(tier => {
        const coneGeo = new THREE.ConeGeometry(tier.r, tier.h, 9);
        const cone = new THREE.Mesh(coneGeo, tier.mat);
        cone.rotation.x = Math.PI / 2;
        cone.position.z = tier.z;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      });

      this.swayingTrees.push({ target: tree, phase: Math.random() * Math.PI * 2, type: 'casuarina' });
      return tree;
    };

    const createRealisticBroadleafTree = (x, y, scale = 1.0) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, 0);

      const trunkH = 16 * scale;
      const trunkGeo = new THREE.CylinderGeometry(0.9 * scale, 1.6 * scale, trunkH, 8);
      const trunk = new THREE.Mesh(trunkGeo, broadleafTrunkMat);
      trunk.rotation.x = Math.PI / 2;
      trunk.position.z = trunkH / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      const branchGeo = new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 8 * scale, 6);
      [0, Math.PI * 0.65, Math.PI * 1.35].forEach((angle) => {
        const b = new THREE.Mesh(branchGeo, broadleafTrunkMat);
        b.position.set(Math.cos(angle) * 2.2 * scale, Math.sin(angle) * 2.2 * scale, trunkH * 0.8);
        b.rotation.x = Math.PI / 3;
        b.rotation.z = angle;
        b.castShadow = true;
        tree.add(b);
      });

      const canopyClusters = [
        { x: 0, y: 0, z: trunkH + 3.0 * scale, r: 6.5 * scale, mat: broadleafFoliageMat1 },
        { x: 3.5 * scale, y: 2.0 * scale, z: trunkH + 1.2 * scale, r: 4.8 * scale, mat: broadleafFoliageMat2 },
        { x: -3.2 * scale, y: -2.2 * scale, z: trunkH + 1.5 * scale, r: 5.0 * scale, mat: broadleafFoliageMat3 },
        { x: -2.4 * scale, y: 3.2 * scale, z: trunkH + 1.8 * scale, r: 4.5 * scale, mat: broadleafFoliageMat1 },
        { x: 2.8 * scale, y: -2.8 * scale, z: trunkH + 1.0 * scale, r: 4.6 * scale, mat: broadleafFoliageMat2 }
      ];

      canopyClusters.forEach(c => {
        const sphereGeo = new THREE.SphereGeometry(c.r, 8, 8);
        const sphere = new THREE.Mesh(sphereGeo, c.mat);
        sphere.position.set(c.x, c.y, c.z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        tree.add(sphere);
      });

      this.swayingTrees.push({ target: tree, phase: Math.random() * Math.PI * 2, type: 'broadleaf' });
      return tree;
    };

    const createShrubCluster = (x, y, scale = 1.0) => {
      const shrub = new THREE.Group();
      shrub.position.set(x, y, 0);

      const sphereGeo = new THREE.SphereGeometry(2.4 * scale, 7, 7);
      const m1 = new THREE.Mesh(sphereGeo, shrubMat);
      m1.position.set(0, 0, 1.8 * scale);
      m1.castShadow = true;
      shrub.add(m1);

      const m2 = new THREE.Mesh(sphereGeo, shrubMat);
      m2.position.set(1.6 * scale, 1.0 * scale, 1.4 * scale);
      m2.scale.set(0.8, 0.8, 0.8);
      m2.castShadow = true;
      shrub.add(m2);

      this.swayingTrees.push({ target: shrub, phase: Math.random() * Math.PI * 2, type: 'shrub' });
      return shrub;
    };

    // Coastal Casuarina Shelterbelt along solid land before the beach (x = 280m to 350m, well before water at x=440m)
    for (let y = -650; y <= 650; y += 22) {
      const xBase = 290 + Math.sin(y * 0.008) * 35;
      const s = 0.85 + Math.random() * 0.35;
      this.treesGroup.add(createRealisticCasuarinaTree(xBase + (Math.random() * 18 - 9), y, s));
      this.treesGroup.add(createRealisticPalmTree(xBase + 28 + (Math.random() * 20), y + (Math.random() * 10 - 5), s * 0.92, 0.1 + Math.random() * 0.12, Math.random() * Math.PI * 2));
      if (Math.random() > 0.4) {
        this.treesGroup.add(createShrubCluster(xBase + 45 + (Math.random() * 14), y, 0.9));
      }
    }

    // Inland Spaceport Tropical Forest & Palm Groves (x = -600m to +250m)
    for (let i = 0; i < 140; i++) {
      const rx = -580 + Math.random() * 780; // All strictly on solid land!
      const ry = -700 + Math.random() * 1400;
      // Skip the immediate optical terminal pad and rocket pad
      if (Math.hypot(rx, ry) < 60 || Math.hypot(rx - 160, ry + 220) < 55) continue;
      
      const s = 0.8 + Math.random() * 0.55;
      if (i % 2 === 0) {
        this.treesGroup.add(createRealisticBroadleafTree(rx, ry, s));
      } else {
        this.treesGroup.add(createRealisticPalmTree(rx, ry, s, 0.08 + Math.random() * 0.08, Math.random() * Math.PI * 2));
      }
    }

    // Roadside Avenue Palms along Main Highway
    for (let x = -480; x <= 260; x += 32) {
      this.treesGroup.add(createRealisticPalmTree(x, 150 + (Math.random() * 6 - 3), 0.88, 0.1, 0.2));
      this.treesGroup.add(createRealisticPalmTree(x, 210 + (Math.random() * 6 - 3), 0.88, -0.1, 3.3));
    }

    // Launch Complex Boulevard Avenue Palms (along x = 145 and x = 175 leading to rocket pad at y = -220)
    for (let y = -20; y >= -170; y -= 24) {
      this.treesGroup.add(createRealisticPalmTree(145, y, 0.95, 0.08, 1.2));
      this.treesGroup.add(createRealisticPalmTree(175, y, 0.95, -0.08, 4.4));
      this.treesGroup.add(createShrubCluster(142, y, 0.85));
      this.treesGroup.add(createShrubCluster(178, y, 0.85));
    }

    // Facility Boundary Trees (all on solid ground)
    const facilityTreeCoords = [
      [-90, -70], [-90, 70], [-130, -50], [-130, 50],
      [80, -90], [80, 90], [130, -110], [130, 110],
      [180, 130], [270, 130], [180, 250], [270, 250],
      [-230, -110], [-230, -170], [-150, -170],
      [-280, 120], [-280, 200], [-340, 160],
      [-180, 220], [-140, 260], [-220, 260]
    ];

    facilityTreeCoords.forEach(pos => {
      this.treesGroup.add(createRealisticBroadleafTree(pos[0], pos[1], 0.8 + Math.random() * 0.3));
      this.treesGroup.add(createShrubCluster(pos[0] + 8, pos[1] + 8, 0.85));
    });

    this.scene.add(this.treesGroup);
  }

  initRangeInfrastructure() {
    this.infraGroup = new THREE.Group();

    const dsnConcreteMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.85, metalness: 0.2 });
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, metalness: 0.85, roughness: 0.15, side: THREE.DoubleSide });
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8, roughness: 0.3 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });

    const dsnTower = new THREE.Group();
    dsnTower.position.set(-200, 170, 0);

    const dsnPedGeo = new THREE.CylinderGeometry(14, 18, 22, 24);
    const dsnPed = new THREE.Mesh(dsnPedGeo, dsnConcreteMat);
    dsnPed.position.z = 11;
    dsnPed.rotation.x = Math.PI / 2;
    dsnPed.castShadow = true;
    dsnPed.receiveShadow = true;
    dsnTower.add(dsnPed);

    const ringTrackGeo = new THREE.TorusGeometry(12, 1.2, 12, 32);
    const ringTrack = new THREE.Mesh(ringTrackGeo, darkMetalMat);
    ringTrack.position.z = 22.5;
    dsnTower.add(ringTrack);

    this.dsnTurret = new THREE.Group();
    this.dsnTurret.position.z = 24;

    const yokeBaseGeo = new THREE.BoxGeometry(22, 18, 5);
    const yokeBase = new THREE.Mesh(yokeBaseGeo, darkMetalMat);
    yokeBase.position.z = 2.5;
    yokeBase.castShadow = true;
    this.dsnTurret.add(yokeBase);

    [-9, 9].forEach(side => {
      const yokeArmGeo = new THREE.BoxGeometry(4.5, 12, 22);
      const yokeArm = new THREE.Mesh(yokeArmGeo, darkMetalMat);
      yokeArm.position.set(side, 0, 14);
      yokeArm.castShadow = true;
      this.dsnTurret.add(yokeArm);
    });

    this.dsnDishAssembly = new THREE.Group();
    this.dsnDishAssembly.position.set(0, 0, 22);

    const mainDishGeo = new THREE.SphereGeometry(32, 36, 24, 0, Math.PI * 2, 0, Math.PI / 3);
    const mainDish = new THREE.Mesh(mainDishGeo, dishMat);
    mainDish.rotation.x = Math.PI;
    mainDish.castShadow = true;
    this.dsnDishAssembly.add(mainDish);

    for (let r = 0; r < Math.PI * 2; r += Math.PI / 6) {
      const ribGeo = new THREE.BoxGeometry(1.2, 30, 2.5);
      const rib = new THREE.Mesh(ribGeo, trussMat);
      rib.position.set(Math.cos(r) * 14, Math.sin(r) * 14, -6);
      rib.rotation.z = r;
      rib.rotation.x = 0.25;
      rib.castShadow = true;
      this.dsnDishAssembly.add(rib);
    }

    [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach(angle => {
      const legGeo = new THREE.CylinderGeometry(0.6, 0.6, 26, 8);
      const leg = new THREE.Mesh(legGeo, darkMetalMat);
      const lx = Math.cos(angle) * 18;
      const ly = Math.sin(angle) * 18;
      leg.position.set(lx * 0.5, ly * 0.5, 11);
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-lx, -ly, 22).normalize());
      leg.castShadow = true;
      this.dsnDishAssembly.add(leg);
    });

    const subReflectorGeo = new THREE.ConeGeometry(4.2, 5.5, 16);
    const subReflector = new THREE.Mesh(subReflectorGeo, darkMetalMat);
    subReflector.position.z = 22;
    subReflector.rotation.x = Math.PI;
    this.dsnDishAssembly.add(subReflector);

    const feedHornGeo = new THREE.CylinderGeometry(1.4, 2.2, 10, 16);
    const feedHorn = new THREE.Mesh(feedHornGeo, darkMetalMat);
    feedHorn.position.z = 5;
    feedHorn.rotation.x = Math.PI / 2;
    this.dsnDishAssembly.add(feedHorn);

    const dsnStrobeGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const dsnStrobe = new THREE.Mesh(dsnStrobeGeo, strobeMat);
    dsnStrobe.position.z = 25;
    this.dsnDishAssembly.add(dsnStrobe);

    this.dsnDishAssembly.rotation.x = -Math.PI / 3.5;
    this.dsnTurret.add(this.dsnDishAssembly);
    dsnTower.add(this.dsnTurret);
    this.infraGroup.add(dsnTower);

    const smallDishTower = new THREE.Group();
    smallDishTower.position.set(-270, 90, 0);

    const sPedGeo = new THREE.CylinderGeometry(8, 10, 14, 16);
    const sPed = new THREE.Mesh(sPedGeo, dsnConcreteMat);
    sPed.position.z = 7;
    sPed.rotation.x = Math.PI / 2;
    sPed.castShadow = true;
    smallDishTower.add(sPed);

    const sDishGeo = new THREE.SphereGeometry(18, 28, 18, 0, Math.PI * 2, 0, Math.PI / 3);
    const sDish = new THREE.Mesh(sDishGeo, dishMat);
    sDish.position.set(0, 0, 22);
    sDish.rotation.x = -Math.PI / 3.2;
    sDish.rotation.y = Math.PI / 8;
    sDish.castShadow = true;
    smallDishTower.add(sDish);
    this.infraGroup.add(smallDishTower);

    const radomeBaseGeo = new THREE.CylinderGeometry(18, 22, 12, 16);
    const radomeBaseMat = new THREE.MeshStandardMaterial({ color: 0x27272a });
    const radomeBase = new THREE.Mesh(radomeBaseGeo, radomeBaseMat);
    radomeBase.position.set(-210, -150, 6);
    radomeBase.rotation.x = Math.PI / 2;
    radomeBase.castShadow = true;
    this.infraGroup.add(radomeBase);

    const radomeGeo = new THREE.SphereGeometry(22, 28, 22);
    const radomeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(-210, -150, 26);
    radome.castShadow = true;
    this.infraGroup.add(radome);

    const strobe = new THREE.Mesh(dsnStrobeGeo, strobeMat);
    strobe.position.set(-210, -150, 49);
    this.infraGroup.add(strobe);

    const bldgGeo = new THREE.BoxGeometry(68, 100, 24);
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, metalness: 0.5, roughness: 0.5 });
    const bldg = new THREE.Mesh(bldgGeo, bldgMat);
    bldg.position.set(230, 190, 12);
    bldg.castShadow = true;
    bldg.receiveShadow = true;
    this.infraGroup.add(bldg);

    [[-60, -60], [60, -60], [-60, 60], [60, 60]].forEach(([tx, ty]) => {
      const towerGeo = new THREE.CylinderGeometry(1.2, 2.5, 52, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.7 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(tx, ty, 26);
      tower.rotation.x = Math.PI / 2;
      tower.castShadow = true;
      this.infraGroup.add(tower);
    });

    this.scene.add(this.infraGroup);
  }

  initLaunchVehicle() {
    this.rocketGroup = new THREE.Group();
    this.rocketGroup.position.set(160, -220, 0);

    const padConcreteMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.85, metalness: 0.2 });
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95 });
    const chevronYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const chevronDarkMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const towerLatticeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.4 });
    const mastMetalMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.8, roughness: 0.3 });
    const strobeRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const waterTankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });

    // 1. Massive Multi-Tier Launch Apron (120m x 120m)
    const baseApronGeo = new THREE.BoxGeometry(120, 120, 3.5);
    const baseApron = new THREE.Mesh(baseApronGeo, padConcreteMat);
    baseApron.position.set(0, 0, 1.75);
    baseApron.receiveShadow = true;
    this.rocketGroup.add(baseApron);

    // Hazard Safety Apron Borders (Yellow & Black perimeter edge)
    const borderGeo = new THREE.RingGeometry(56, 59, 4, 1, Math.PI / 4);
    const border = new THREE.Mesh(borderGeo, chevronYellowMat);
    border.position.set(0, 0, 3.55);
    this.rocketGroup.add(border);

    // 2. Flame Exhaust Trench & Deflector Flume
    const trenchGeo = new THREE.BoxGeometry(26, 68, 6.0);
    const trench = new THREE.Mesh(trenchGeo, trenchMat);
    trench.position.set(0, 0, 0.5);
    this.rocketGroup.add(trench);

    const deflectorGeo = new THREE.ConeGeometry(12, 18, 4);
    const deflector = new THREE.Mesh(deflectorGeo, trenchMat);
    deflector.position.set(0, 0, -2.5);
    deflector.rotation.x = Math.PI / 4;
    this.rocketGroup.add(deflector);

    // 3. Mobile Launch Pedestal (MLP) Table
    const mlpGeo = new THREE.BoxGeometry(38, 38, 7.5);
    const mlpMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.75, roughness: 0.3 });
    const mlp = new THREE.Mesh(mlpGeo, mlpMat);
    mlp.position.set(0, 0, 7.25);
    mlp.castShadow = true;
    mlp.receiveShadow = true;
    this.rocketGroup.add(mlp);

    // 4. Four 65-Meter Lightning Protection Masts with warning beacons
    [[-52, -52], [52, -52], [-52, 52], [52, 52]].forEach(([mx, my]) => {
      const mastGeo = new THREE.CylinderGeometry(0.5, 2.2, 65, 8);
      const mastMesh = new THREE.Mesh(mastGeo, mastMetalMat);
      mastMesh.position.set(mx, my, 32.5);
      mastMesh.rotation.x = Math.PI / 2;
      mastMesh.castShadow = true;
      this.rocketGroup.add(mastMesh);

      const mastStrobeGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const mastStrobe = new THREE.Mesh(mastStrobeGeo, strobeRedMat);
      mastStrobe.position.set(mx, my, 65.5);
      this.rocketGroup.add(mastStrobe);
    });

    // 5. Sound Suppression Water Deluge Tank & Piping
    const waterTankGeo = new THREE.CylinderGeometry(8, 8, 28, 16);
    const waterTank = new THREE.Mesh(waterTankGeo, waterTankMat);
    waterTank.position.set(48, 0, 17.5);
    waterTank.rotation.x = Math.PI / 2;
    waterTank.castShadow = true;
    this.rocketGroup.add(waterTank);

    const pipeGeo = new THREE.CylinderGeometry(1.4, 1.4, 34, 12);
    const pipe = new THREE.Mesh(pipeGeo, mastMetalMat);
    pipe.position.set(28, 0, 11);
    pipe.rotation.z = Math.PI / 2;
    this.rocketGroup.add(pipe);

    // 6. ISRO Launch Vehicle (PSLV / GSLV)
    const rocketWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, metalness: 0.3, roughness: 0.4 });
    const rocketOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.4, roughness: 0.3 });
    const metalDarkMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85 });

    const s1Geo = new THREE.CylinderGeometry(4.0, 4.0, 32, 24);
    const s1 = new THREE.Mesh(s1Geo, rocketWhiteMat);
    s1.rotation.x = Math.PI / 2;
    s1.position.z = 27;
    s1.castShadow = true;
    this.rocketGroup.add(s1);

    const s2Geo = new THREE.CylinderGeometry(3.8, 4.0, 14, 24);
    const s2 = new THREE.Mesh(s2Geo, rocketOrangeMat);
    s2.rotation.x = Math.PI / 2;
    s2.position.z = 50;
    s2.castShadow = true;
    this.rocketGroup.add(s2);

    const s3Geo = new THREE.CylinderGeometry(3.2, 3.8, 12, 24);
    const s3 = new THREE.Mesh(s3Geo, rocketWhiteMat);
    s3.rotation.x = Math.PI / 2;
    s3.position.z = 63;
    s3.castShadow = true;
    this.rocketGroup.add(s3);

    const fairingGeo = new THREE.ConeGeometry(3.2, 14, 24);
    const fairing = new THREE.Mesh(fairingGeo, rocketWhiteMat);
    fairing.rotation.x = Math.PI / 2;
    fairing.position.z = 76;
    fairing.castShadow = true;
    this.rocketGroup.add(fairing);

    [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach(angle => {
      const bx = Math.cos(angle) * 5.8;
      const by = Math.sin(angle) * 5.8;

      const boosterGeo = new THREE.CylinderGeometry(1.4, 1.4, 22, 12);
      const booster = new THREE.Mesh(boosterGeo, rocketWhiteMat);
      booster.rotation.x = Math.PI / 2;
      booster.position.set(bx, by, 22);
      booster.castShadow = true;
      this.rocketGroup.add(booster);

      const noseGeo = new THREE.ConeGeometry(1.4, 4.5, 12);
      const nose = new THREE.Mesh(noseGeo, rocketOrangeMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(bx, by, 35.25);
      nose.castShadow = true;
      this.rocketGroup.add(nose);
    });

    // Umbilical Service Tower (Red Lattice) & Crane
    const gantryGeo = new THREE.BoxGeometry(8, 8, 76);
    const gantry = new THREE.Mesh(gantryGeo, towerLatticeMat);
    gantry.position.set(-15, 0, 48);
    gantry.castShadow = true;
    this.rocketGroup.add(gantry);

    [32, 50, 66].forEach(h => {
      const armGeo = new THREE.BoxGeometry(11, 3, 1.8);
      const arm = new THREE.Mesh(armGeo, metalDarkMat);
      arm.position.set(-7.5, 0, h);
      arm.castShadow = true;
      this.rocketGroup.add(arm);
    });

    const craneGeo = new THREE.BoxGeometry(24, 2.5, 2.5);
    const crane = new THREE.Mesh(craneGeo, towerLatticeMat);
    crane.position.set(-4, 0, 87);
    crane.castShadow = true;
    this.rocketGroup.add(crane);

    this.scene.add(this.rocketGroup);
  }

  initCryogenicTanks() {
    this.cryoGroup = new THREE.Group();
    this.cryoGroup.position.set(-140, -220, 0);

    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.75, roughness: 0.25 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8 });

    [-24, 24].forEach(offX => {
      const tankGeo = new THREE.SphereGeometry(14, 24, 24);
      const tank = new THREE.Mesh(tankGeo, sphereMat);
      tank.position.set(offX, 0, 18);
      tank.castShadow = true;
      this.cryoGroup.add(tank);

      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        const legGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        const leg = new THREE.Mesh(legGeo, frameMat);
        leg.position.set(offX + Math.cos(a) * 11, Math.sin(a) * 11, 6);
        leg.rotation.x = Math.PI / 2;
        leg.castShadow = true;
        this.cryoGroup.add(leg);
      }
    });

    const bundGeo = new THREE.BoxGeometry(84, 46, 3.5);
    const bundMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const bund = new THREE.Mesh(bundGeo, bundMat);
    bund.position.set(0, 0, 1.75);
    bund.receiveShadow = true;
    this.cryoGroup.add(bund);

    this.scene.add(this.cryoGroup);
  }

  initAssemblyHighBay() {
    this.vibGroup = new THREE.Group();
    this.vibGroup.position.set(240, -60, 0);

    const vibMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.4, roughness: 0.6 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });

    const vibGeo = new THREE.BoxGeometry(60, 80, 52);
    const vib = new THREE.Mesh(vibGeo, vibMat);
    vib.position.set(0, 0, 26);
    vib.castShadow = true;
    vib.receiveShadow = true;
    this.vibGroup.add(vib);

    const doorGeo = new THREE.BoxGeometry(24, 2, 44);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, -40, 22);
    this.vibGroup.add(door);

    this.scene.add(this.vibGroup);
  }

  initMetStation() {
    this.metGroup = new THREE.Group();
    this.metGroup.position.set(-60, 240, 0);

    const mastMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8 });
    const mastGeo = new THREE.CylinderGeometry(0.6, 1.4, 38, 8);
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.rotation.x = Math.PI / 2;
    mast.position.z = 19;
    mast.castShadow = true;
    this.metGroup.add(mast);

    this.anemometer = new THREE.Group();
    this.anemometer.position.set(0, 0, 38);

    for (let i = 0; i < 3; i++) {
      const armAngle = (i / 3) * Math.PI * 2;
      const cupArmGeo = new THREE.BoxGeometry(3.5, 0.2, 0.2);
      const cupArm = new THREE.Mesh(cupArmGeo, mastMat);
      cupArm.position.set(Math.cos(armAngle) * 1.8, Math.sin(armAngle) * 1.8, 0);
      cupArm.rotation.z = armAngle;
      this.anemometer.add(cupArm);

      const cupGeo = new THREE.SphereGeometry(0.8, 8, 8, 0, Math.PI);
      const cup = new THREE.Mesh(cupGeo, mastMat);
      cup.position.set(Math.cos(armAngle) * 3.6, Math.sin(armAngle) * 3.6, 0);
      cup.rotation.z = armAngle + Math.PI / 2;
      this.anemometer.add(cup);
    }

    this.metGroup.add(this.anemometer);
    this.anemometerRotors.push(this.anemometer);

    // Dynamic Aviation Windsock Assembly
    this.windsockMount = new THREE.Group();
    this.windsockMount.position.set(0, 0, 30);

    const hoopGeo = new THREE.TorusGeometry(1.6, 0.2, 8, 16);
    const hoopMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 });
    const hoop = new THREE.Mesh(hoopGeo, hoopMat);
    hoop.rotation.y = Math.PI / 2;
    this.windsockMount.add(hoop);

    const sockGeo = new THREE.CylinderGeometry(1.5, 0.6, 12, 16, 1, true);
    const sockMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    this.windsockCone = new THREE.Mesh(sockGeo, sockMat);
    this.windsockCone.position.set(6, 0, 0);
    this.windsockCone.rotation.z = -Math.PI / 2;
    this.windsockMount.add(this.windsockCone);

    this.metGroup.add(this.windsockMount);
    this.scene.add(this.metGroup);
  }

  initGroundVehicles() {
    this.vehiclesGroup = new THREE.Group();

    const vanBodyMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.5, roughness: 0.4 });
    const policeBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.3 });
    const tankerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });
    const crawlerMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.7, roughness: 0.4 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
    const strobeBlueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const strobeRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // 1. Mobile Radar / Telemetry Communication Van at (160, 120)
    const van = new THREE.Group();
    van.position.set(160, 120, 0);

    const bodyGeo = new THREE.BoxGeometry(16, 7, 7);
    const body = new THREE.Mesh(bodyGeo, vanBodyMat);
    body.position.z = 4.5;
    body.castShadow = true;
    van.add(body);

    const vanDishGeo = new THREE.SphereGeometry(3.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3);
    const vanDish = new THREE.Mesh(vanDishGeo, dishMat);
    vanDish.position.set(0, 0, 9.5);
    vanDish.rotation.x = -Math.PI / 4;
    van.add(vanDish);

    [[-5, -3.8], [5, -3.8], [-5, 3.8], [5, 3.8]].forEach(([wx, wy]) => {
      const wheelGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.2, 12);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, 1.4);
      van.add(wheel);
    });
    this.vehiclesGroup.add(van);

    // 2. ISRO Range Safety Patrol SUVs (2 Units)
    const createPatrolSUV = (x, y, rotZ = 0) => {
      const suv = new THREE.Group();
      suv.position.set(x, y, 0);
      suv.rotation.z = rotZ;

      const sBodyGeo = new THREE.BoxGeometry(10, 5, 4.5);
      const sBody = new THREE.Mesh(sBodyGeo, policeBodyMat);
      sBody.position.z = 3.2;
      sBody.castShadow = true;
      suv.add(sBody);

      const lightbarGeo = new THREE.BoxGeometry(3.5, 1.2, 0.6);
      const lightbar = new THREE.Mesh(lightbarGeo, strobeBlueMat);
      lightbar.position.set(0, 0, 5.8);
      suv.add(lightbar);

      [[-3.2, -2.6], [3.2, -2.6], [-3.2, 2.6], [3.2, 2.6]].forEach(([wx, wy]) => {
        const wGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.9, 12);
        const w = new THREE.Mesh(wGeo, wheelMat);
        w.position.set(wx, wy, 1.1);
        suv.add(w);
      });

      return suv;
    };

    this.vehiclesGroup.add(createPatrolSUV(30, 20, 0.4));
    this.vehiclesGroup.add(createPatrolSUV(130, -160, -0.6));

    // 3. Cryogenic Propellant Tanker Trucks (LOX/LH2 Fuel Transporters at Cryo Farm)
    const createCryoTanker = (x, y, rotZ = 0) => {
      const tanker = new THREE.Group();
      tanker.position.set(x, y, 0);
      tanker.rotation.z = rotZ;

      const cabGeo = new THREE.BoxGeometry(6, 5, 5);
      const cab = new THREE.Mesh(cabGeo, vanBodyMat);
      cab.position.set(7, 0, 3.5);
      cab.castShadow = true;
      tanker.add(cab);

      const tCylGeo = new THREE.CylinderGeometry(2.4, 2.4, 16, 16);
      const tCyl = new THREE.Mesh(tCylGeo, tankerMat);
      tCyl.rotation.z = Math.PI / 2;
      tCyl.position.set(-4, 0, 4.2);
      tCyl.castShadow = true;
      tanker.add(tCyl);

      [[-10, -2.8], [-4, -2.8], [2, -2.8], [7, -2.8], [-10, 2.8], [-4, 2.8], [2, 2.8], [7, 2.8]].forEach(([wx, wy]) => {
        const wGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 12);
        const w = new THREE.Mesh(wGeo, wheelMat);
        w.position.set(wx, wy, 1.2);
        tanker.add(w);
      });

      return tanker;
    };

    this.vehiclesGroup.add(createCryoTanker(-110, -200, 0.2));
    this.vehiclesGroup.add(createCryoTanker(-110, -235, 0.2));

    // 4. Heavy Mobile Launch Transporter (Crawler Carrier) on Crawlerway
    const crawler = new THREE.Group();
    crawler.position.set(200, -140, 0.8);
    crawler.rotation.z = 0.45;

    const cBodyGeo = new THREE.BoxGeometry(24, 20, 4.5);
    const cBody = new THREE.Mesh(cBodyGeo, crawlerMat);
    cBody.position.z = 3.5;
    cBody.castShadow = true;
    crawler.add(cBody);

    // 4 Heavy Track Bogies
    [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([tx, ty]) => {
      const bGeo = new THREE.BoxGeometry(6, 3.2, 2.5);
      const b = new THREE.Mesh(bGeo, wheelMat);
      b.position.set(tx, ty, 1.25);
      crawler.add(b);
    });

    this.vehiclesGroup.add(crawler);
    this.scene.add(this.vehiclesGroup);
  }

  initStreetLamps() {
    this.lampsGroup = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const lampPositions = [
      [-100, 165], [0, 165], [100, 165],
      [-100, -165], [0, -165], [100, -165]
    ];

    lampPositions.forEach(pos => {
      const poleGeo = new THREE.CylinderGeometry(0.3, 0.4, 14, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.rotation.x = Math.PI / 2;
      pole.position.set(pos[0], pos[1], 7);
      pole.castShadow = true;
      this.lampsGroup.add(pole);

      const bulbGeo = new THREE.SphereGeometry(0.8, 8, 8);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(pos[0], pos[1] + 1.2, 13.8);
      this.lampsGroup.add(bulb);
    });

    this.scene.add(this.lampsGroup);
  }

  initGroundTerminal() {
    this.baseGroup = new THREE.Group();

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.85, metalness: 0.2 });
    const whiteDomeMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.35, metalness: 0.3 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.2 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7, roughness: 0.3 });

    const pierGeo = new THREE.CylinderGeometry(24, 28, 14, 24);
    const pier = new THREE.Mesh(pierGeo, concreteMat);
    pier.rotation.x = Math.PI / 2;
    pier.position.z = 7;
    pier.castShadow = true;
    pier.receiveShadow = true;
    this.baseGroup.add(pier);

    const drumGeo = new THREE.CylinderGeometry(22, 22, 12, 32);
    const drum = new THREE.Mesh(drumGeo, whiteDomeMat);
    drum.rotation.x = Math.PI / 2;
    drum.position.z = 18;
    drum.castShadow = true;
    this.baseGroup.add(drum);

    this.domeGroup = new THREE.Group();
    this.domeGroup.position.z = 24;

    const domeHemisphereGeo = new THREE.SphereGeometry(22, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeHemisphere = new THREE.Mesh(domeHemisphereGeo, whiteDomeMat);
    domeHemisphere.castShadow = true;
    this.domeGroup.add(domeHemisphere);

    const shutterLeftGeo = new THREE.BoxGeometry(6, 22, 22);
    const shutterLeft = new THREE.Mesh(shutterLeftGeo, darkMetalMat);
    shutterLeft.position.set(-8, 0, 11);
    this.domeGroup.add(shutterLeft);

    const shutterRightGeo = new THREE.BoxGeometry(6, 22, 22);
    const shutterRight = new THREE.Mesh(shutterRightGeo, darkMetalMat);
    shutterRight.position.set(8, 0, 11);
    this.domeGroup.add(shutterRight);

    this.baseGroup.add(this.domeGroup);

    this.panTurret = new THREE.Group();
    this.panTurret.position.z = 18;

    const forkBaseGeo = new THREE.CylinderGeometry(14, 14, 4, 32);
    const forkBase = new THREE.Mesh(forkBaseGeo, darkMetalMat);
    forkBase.rotation.x = Math.PI / 2;
    forkBase.position.z = 2;
    forkBase.castShadow = true;
    this.panTurret.add(forkBase);

    [-10, 10].forEach(side => {
      const armGeo = new THREE.BoxGeometry(4, 9, 22);
      const arm = new THREE.Mesh(armGeo, darkMetalMat);
      arm.position.set(side, 0, 13);
      arm.castShadow = true;
      this.panTurret.add(arm);
    });

    this.tiltAssembly = new THREE.Group();
    this.tiltAssembly.position.set(0, 0, 20);

    const mirrorCellGeo = new THREE.CylinderGeometry(8.5, 9.0, 7.0, 32);
    const mirrorCell = new THREE.Mesh(mirrorCellGeo, darkMetalMat);
    mirrorCell.rotation.x = Math.PI / 2;
    mirrorCell.position.y = 3.5;
    mirrorCell.castShadow = true;
    this.tiltAssembly.add(mirrorCell);

    for (let t = 0; t < Math.PI * 2; t += Math.PI / 2) {
      const strutGeo = new THREE.CylinderGeometry(0.4, 0.4, 24, 8);
      const strut = new THREE.Mesh(strutGeo, carbonMat);
      const tx = Math.cos(t) * 7.5;
      const tz = Math.sin(t) * 7.5;
      strut.position.set(tx, 15, tz);
      strut.rotation.x = Math.PI / 2;
      strut.castShadow = true;
      this.tiltAssembly.add(strut);
    }

    const topRingGeo = new THREE.CylinderGeometry(8.5, 8.5, 6, 32, 1, true);
    const topRing = new THREE.Mesh(topRingGeo, darkMetalMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 27;
    topRing.castShadow = true;
    this.tiltAssembly.add(topRing);

    const lensGeo = new THREE.CircleGeometry(7.8, 32);
    this.collimatorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const lens = new THREE.Mesh(lensGeo, this.collimatorMat);
    lens.position.y = 29.5;
    this.tiltAssembly.add(lens);

    const spiderMat = new THREE.MeshStandardMaterial({ color: 0x111113, metalness: 0.9 });
    const spider1Geo = new THREE.BoxGeometry(15.5, 0.2, 2.0);
    const spider1 = new THREE.Mesh(spider1Geo, spiderMat);
    spider1.position.y = 27;
    this.tiltAssembly.add(spider1);

    const spider2Geo = new THREE.BoxGeometry(0.2, 15.5, 2.0);
    const spider2 = new THREE.Mesh(spider2Geo, spiderMat);
    spider2.position.y = 27;
    this.tiltAssembly.add(spider2);

    const finderGeo = new THREE.CylinderGeometry(2.2, 2.2, 16, 16);
    const finder = new THREE.Mesh(finderGeo, carbonMat);
    finder.rotation.x = Math.PI / 2;
    finder.position.set(8.5, 14, 5.5);
    finder.castShadow = true;
    this.tiltAssembly.add(finder);

    this.panTurret.add(this.tiltAssembly);
    this.baseGroup.add(this.panTurret);
    this.scene.add(this.baseGroup);
  }

  initSpacecraftSatellite() {
    this.uavGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(22, 22, 10.0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.9,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.uavGroup.add(body);

    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.8,
      roughness: 0.15
    });

    [-1, 1].forEach(side => {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(side * 28, 0, 0);

      const panelGeo = new THREE.BoxGeometry(32, 14, 1.2);
      const panelMesh = new THREE.Mesh(panelGeo, panelMat);
      panelMesh.castShadow = true;
      panelGroup.add(panelMesh);

      const busbarGeo = new THREE.BoxGeometry(32, 0.4, 1.3);
      const busbarMat = new THREE.MeshBasicMaterial({ color: 0xe4e4e7 });
      [-4, 0, 4].forEach(offsetY => {
        const busbar = new THREE.Mesh(busbarGeo, busbarMat);
        busbar.position.y = offsetY;
        panelGroup.add(busbar);
      });

      const yokeGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
      const yokeMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46 });
      const yoke = new THREE.Mesh(yokeGeo, yokeMat);
      yoke.position.set(-side * 18, 0, 0);
      yoke.rotation.z = Math.PI / 2;
      panelGroup.add(yoke);

      this.uavGroup.add(panelGroup);
    });

    const beaconGeo = new THREE.SphereGeometry(6.5, 24, 24);
    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const beacon = new THREE.Mesh(beaconGeo, this.beaconMat);
    beacon.position.z = -7.5;
    this.uavGroup.add(beacon);

    const hornGeo = new THREE.ConeGeometry(3.5, 7.0, 16);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.9 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(0, 0, 8.5);
    horn.rotation.x = Math.PI;
    this.uavGroup.add(horn);

    this.rotors = [];
    const armCoords = [[16, 16], [-16, 16], [16, -16], [-16, -16]];
    armCoords.forEach((pos, idx) => {
      const propGroup = new THREE.Group();
      propGroup.position.set(pos[0], pos[1], 6.0);

      const bladeGeo = new THREE.BoxGeometry(20, 2.4, 0.4);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      propGroup.add(blade);

      const discGeo = new THREE.CircleGeometry(10, 24);
      const discMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
      const disc = new THREE.Mesh(discGeo, discMat);
      propGroup.add(disc);

      this.uavGroup.add(propGroup);
      this.rotors.push(propGroup);

      const ledGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: idx < 2 ? 0xef4444 : 0x10b981 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(pos[0], pos[1], -2.0);
      this.uavGroup.add(led);
    });

    this.uavGroup.position.set(150, 100, 120);
    this.scene.add(this.uavGroup);
  }

  initOpticalLaser() {
    const laserGeo = new THREE.BufferGeometry();
    laserGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));

    this.laserMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 4,
      transparent: true,
      opacity: 0.95
    });
    this.laserBeam = new THREE.Line(laserGeo, this.laserMat);
    this.scene.add(this.laserBeam);

    const beamSheathGeo = new THREE.CylinderGeometry(1.4, 3.6, 1, 16, 1, true);
    this.beamSheathMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.beamSheath = new THREE.Mesh(beamSheathGeo, this.beamSheathMat);
    this.scene.add(this.beamSheath);

    const flareGeo = new THREE.SphereGeometry(8.5, 16, 16);
    this.flareMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65
    });
    this.laserFlare = new THREE.Mesh(flareGeo, this.flareMat);
    this.scene.add(this.laserFlare);
  }

  initFlightTrail() {
    this.trailMax = 160;
    this.trailGeo = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(this.trailMax * 3);
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));

    this.trailMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      linewidth: 3
    });
    this.trailLine = new THREE.Line(this.trailGeo, this.trailMat);
    this.scene.add(this.trailLine);
  }

  initOcclusionClouds() {
    this.cloudsGroup = new THREE.Group();
    this.ambientDefaultClouds = [];
    this.stormFrontClouds = [];

    // Realistic multi-tier cloud materials with soft atmospheric scattering
    const cloudMatWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.85,
      roughness: 0.95,
      metalness: 0.05
    });

    const cloudMatGray = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      transparent: true,
      opacity: 0.88,
      roughness: 0.98,
      metalness: 0.02
    });

    const cloudMatDark = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.92,
      roughness: 1.0,
      metalness: 0.0
    });

    const createCloudCluster = (baseScale = 1.0, tintType = 'white') => {
      const cluster = new THREE.Group();
      const baseMat = (tintType === 'dark' ? cloudMatDark : (tintType === 'gray' ? cloudMatGray : cloudMatWhite)).clone();
      
      const sphereCount = 10;
      const sphereOffsets = [
        [0, 0, 0, 32],
        [-24, 12, -4, 26],
        [24, -12, 5, 28],
        [12, 22, 7, 24],
        [-18, -18, 2, 25],
        [28, 16, -5, 22],
        [-26, -10, 5, 23],
        [0, -24, -3, 25],
        [16, -20, 8, 21],
        [-10, 26, -4, 20]
      ];

      sphereOffsets.slice(0, sphereCount).forEach(([ox, oy, oz, r]) => {
        const sphereGeo = new THREE.SphereGeometry(r * baseScale, 14, 12);
        const mesh = new THREE.Mesh(sphereGeo, baseMat);
        mesh.position.set(ox * baseScale, oy * baseScale, oz * baseScale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        cluster.add(mesh);
      });

      return cluster;
    };

    // 1. DEFAULT AMBIENT CLOUDS (3 Peaceful Natural Clouds high in the sky in normal mode)
    const ambientConfigs = [
      { id: 'amb1', pos: new THREE.Vector3(140, 160, 145), scale: 1.15, tint: 'white' },
      { id: 'amb2', pos: new THREE.Vector3(-150, 100, 140), scale: 1.05, tint: 'gray' },
      { id: 'amb3', pos: new THREE.Vector3(190, -150, 155), scale: 1.20, tint: 'white' }
    ];

    ambientConfigs.forEach(cfg => {
      const cluster = createCloudCluster(cfg.scale, cfg.tint);
      cluster.position.copy(cfg.pos);
      cluster.userData = {
        defaultPos: cfg.pos.clone(),
        driftSpeed: 0.12 + Math.random() * 0.08,
        driftPhase: Math.random() * Math.PI * 2,
        baseScale: cfg.scale
      };
      this.ambientDefaultClouds.push(cluster);
      this.cloudsGroup.add(cluster);
    });

    // 2. FULL-SKY STORM FRONT CLOUDS (Strictly in the upper sky at drone flight altitude & above: z = 135m - 240m)
    const stormGrid = [
      // Flight Level Sky Canopy (z = 135m - 155m, directly at drone flight level)
      { x: 0, y: 130, z: 138, scale: 1.4, tint: 'dark' },
      { x: 80, y: 140, z: 142, scale: 1.5, tint: 'gray' },
      { x: -80, y: 130, z: 140, scale: 1.4, tint: 'dark' },
      { x: 0, y: 70, z: 136, scale: 1.3, tint: 'gray' },
      { x: 130, y: 80, z: 144, scale: 1.5, tint: 'white' },
      { x: -130, y: 70, z: 142, scale: 1.4, tint: 'dark' },
      { x: 60, y: 200, z: 146, scale: 1.5, tint: 'white' },
      { x: -60, y: 190, z: 143, scale: 1.4, tint: 'gray' },

      // Mid-Sky Surrounding Atmospheric Blanket (z = 165m - 195m)
      { x: 180, y: 180, z: 172, scale: 1.6, tint: 'white' },
      { x: -180, y: 170, z: 170, scale: 1.6, tint: 'gray' },
      { x: 220, y: 40, z: 175, scale: 1.7, tint: 'dark' },
      { x: -220, y: 30, z: 170, scale: 1.6, tint: 'white' },
      { x: 160, y: -80, z: 178, scale: 1.6, tint: 'gray' },
      { x: -160, y: -90, z: 172, scale: 1.7, tint: 'dark' },
      { x: 0, y: -140, z: 168, scale: 1.5, tint: 'white' },
      { x: 90, y: -180, z: 176, scale: 1.6, tint: 'gray' },
      { x: -90, y: -170, z: 172, scale: 1.7, tint: 'dark' },

      // High-Altitude Storm Ceiling (z = 210m - 245m)
      { x: 0, y: 80, z: 225, scale: 2.1, tint: 'dark' },
      { x: 140, y: 140, z: 235, scale: 2.0, tint: 'gray' },
      { x: -140, y: 130, z: 230, scale: 1.9, tint: 'dark' },
      { x: 150, y: -100, z: 240, scale: 2.1, tint: 'white' },
      { x: -160, y: -90, z: 235, scale: 2.0, tint: 'gray' },
      { x: 0, y: 240, z: 230, scale: 1.9, tint: 'dark' },
      { x: 0, y: -220, z: 235, scale: 2.0, tint: 'gray' }
    ];

    stormGrid.forEach((cfg, idx) => {
      const cluster = createCloudCluster(cfg.scale, cfg.tint);
      
      // Resting position when clear sky: dispersed on outer perimeter high in the sky
      const angle = (idx / stormGrid.length) * Math.PI * 2;
      const dist = 950 + Math.random() * 200;
      const restPos = new THREE.Vector3(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        400 + Math.sin(idx) * 60
      );

      cluster.position.copy(restPos);
      cluster.scale.set(0.02, 0.02, 0.02); // Dissolved / hidden when clear sky

      cluster.userData = {
        restPos: restPos,
        stormPos: new THREE.Vector3(cfg.x, cfg.y, cfg.z),
        driftSpeed: 0.15 + Math.random() * 0.15,
        driftPhase: Math.random() * Math.PI * 2,
        baseScale: cfg.scale
      };

      this.stormFrontClouds.push(cluster);
      this.cloudsGroup.add(cluster);
    });

    this.scene.add(this.cloudsGroup);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    const lookAngleEl = document.getElementById('sat-look-angle');

    if (mode === 'free') {
      if (this.controls) {
        this.controls.enabled = true;
        this.controls.target.set(0, 0, 38);
        this.controls.update();
      }
      this.camera.up.set(0, 0, 1);
      if (lookAngleEl) lookAngleEl.textContent = 'Free Tactical Camera';
    } else if (mode === 'follow') {
      if (this.controls) this.controls.enabled = false;
      this.camera.up.set(0, 0, 1);
      if (lookAngleEl) lookAngleEl.textContent = 'Target Chase Camera';
    } else if (mode === 'terminal') {
      if (this.controls) this.controls.enabled = false;
      this.camera.position.set(0, 0, 38);
      this.camera.up.set(0, 0, 1);
      if (lookAngleEl) lookAngleEl.textContent = 'Ground Station Boresight';
    } else if (mode === 'satellite') {
      if (this.controls) this.controls.enabled = false;
      this.camera.up.set(0, 0, 1);
      if (lookAngleEl) lookAngleEl.textContent = 'Orbital Space Satellite View (LEO 505km)';
    } else if (mode === 'recon') {
      if (this.controls) this.controls.enabled = false;
      this.camera.up.set(0, 1, 0);
      if (lookAngleEl) lookAngleEl.textContent = 'Top-Down Nadir Reconnaissance';
    }
  }

  setSensorFilter(filterMode) {
    this.sensorFilter = filterMode;
    const newTex = generateSatelliteMapTexture(filterMode);
    this.groundMat.map = newTex;
    this.groundMat.needsUpdate = true;

    if (filterMode === 'thermal') {
      this.scene.background.setHex(0x050410);
      this.ambientLight.color.setHex(0xa855f7);
      this.ambientLight.intensity = 1.4;
      this.sunLight.color.setHex(0xf59e0b);
    } else if (filterMode === 'night') {
      this.scene.background.setHex(0x020305);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.6;
      this.sunLight.intensity = 0.8;
    } else if (filterMode === 'sar') {
      this.scene.background.setHex(0x06070a);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.8;
      this.sunLight.color.setHex(0xffffff);
    } else {
      this.scene.background.setHex(0x040508);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 2.0;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 3.6;
    }
  }

  update(telemetry) {
    if (!telemetry || !telemetry.target) return;

    const pos = telemetry.target.position;
    const vel = telemetry.target.velocity || [0, 0, 0];
    this.lastTargetPos.set(pos[0], pos[1], pos[2]);
    this.lastTargetVel = vel;
    this.isOccludedVisual = Boolean(telemetry.target.is_occluded);

    this.uavGroup.position.set(pos[0], pos[1], pos[2]);
    this.uavLight.position.set(pos[0], pos[1], pos[2]);

    const velLen = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1]);
    const heading = velLen > 0.5 ? Math.atan2(vel[1], vel[0]) : Math.atan2(pos[1], pos[0]) + Math.PI / 2;
    this.uavGroup.rotation.z = heading - Math.PI / 2;
    this.uavGroup.rotation.x = Math.max(-0.25, Math.min(0.25, vel[2] * 0.02));

    this.rotors.forEach((r, idx) => {
      r.rotation.z += (idx % 2 === 0 ? 0.55 : -0.55);
    });

    this.flightHistory.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
    if (this.flightHistory.length > this.trailMax) {
      this.flightHistory.shift();
    }
    const posArr = this.trailPositions;
    for (let i = 0; i < this.flightHistory.length; i++) {
      posArr[i * 3] = this.flightHistory[i].x;
      posArr[i * 3 + 1] = this.flightHistory[i].y;
      posArr[i * 3 + 2] = this.flightHistory[i].z;
    }
    this.trailGeo.setDrawRange(0, this.flightHistory.length);
    this.trailGeo.attributes.position.needsUpdate = true;

    if (telemetry.gimbal) {
      const azRad = THREE.MathUtils.degToRad(telemetry.gimbal.gimbal_azimuth_deg);
      const elRad = THREE.MathUtils.degToRad(telemetry.gimbal.gimbal_elevation_deg);

      this.panTurret.rotation.z = -azRad + Math.PI / 2;
      this.tiltAssembly.rotation.x = -elRad;
      if (this.domeGroup) {
        this.domeGroup.rotation.z = -azRad + Math.PI / 2;
      }
      if (this.dsnTurret) {
        this.dsnTurret.rotation.z = -azRad * 0.4;
      }
    }

    const startPt = new THREE.Vector3(0, 0, 38);
    const endPt = new THREE.Vector3(pos[0], pos[1], pos[2] - 7.5);
    const posAttr = this.laserBeam.geometry.attributes.position;
    posAttr.setXYZ(0, startPt.x, startPt.y, startPt.z);
    posAttr.setXYZ(1, endPt.x, endPt.y, endPt.z);
    posAttr.needsUpdate = true;

    const distance = startPt.distanceTo(endPt);
    this.beamSheath.position.copy(startPt).lerp(endPt, 0.5);
    this.beamSheath.scale.set(1, distance, 1);
    this.beamSheath.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endPt.clone().sub(startPt).normalize());

    this.laserFlare.position.copy(endPt);

    const isLocked = telemetry.gimbal?.is_locked;
    const isOccluded = telemetry.target?.is_occluded;
    const totalErrorDeg = telemetry.gimbal?.total_error_deg || 10.0;
    const legendSwatch = document.getElementById('legend-laser-swatch');

    let activeColor = 0xffffff;
    let activeHex = '#FFFFFF';

    if (isOccluded) {
      // Active SWIR / Multi-Spectral Laser Tracing Probe penetrating cloud layer
      activeColor = 0x00e5ff;
      activeHex = '#00E5FF';
      this.laserMat.opacity = 0.92;
      this.beamSheathMat.opacity = 0.50;
      this.terminalLight.color.setHex(0x00e5ff);
      this.terminalLight.intensity = 4.2;
      this.beaconMat.color.setHex(0x00e5ff);
      this.flareMat.color.setHex(0x38bdf8);
      this.uavLight.color.setHex(0x00e5ff);
      this.uavLight.intensity = 3.5;
    } else if (isLocked) {
      activeColor = 0xffffff;
      activeHex = '#FFFFFF';
      this.laserMat.opacity = 0.95;
      this.beamSheathMat.opacity = 0.55;
      this.terminalLight.color.setHex(0xffffff);
      this.terminalLight.intensity = 4.0;
      this.beaconMat.color.setHex(0xffffff);
      this.flareMat.color.setHex(0xffffff);
      this.uavLight.color.setHex(0xffffff);
      this.uavLight.intensity = 2.0;
    } else if (totalErrorDeg <= 2.5) {
      activeColor = 0xffffff;
      activeHex = '#FFFFFF';
      this.laserMat.opacity = 0.75;
      this.beamSheathMat.opacity = 0.35;
    } else {
      activeColor = 0xef4444;
      activeHex = '#EF4444';
      this.laserMat.opacity = 0.35;
      this.beamSheathMat.opacity = 0.15;
    }

    this.laserMat.color.setHex(activeColor);
    this.beamSheathMat.color.setHex(activeColor);
    this.beaconMat.color.setHex(activeColor);
    this.flareMat.color.setHex(activeColor);
    this.collimatorMat.color.setHex(activeColor);
    if (legendSwatch) legendSwatch.style.background = activeHex;

    document.getElementById('tgt-range-overlay').textContent = `${telemetry.target.distance.toFixed(1)} m`;
    document.getElementById('tgt-azimuth-overlay').textContent = `${telemetry.target.true_azimuth_deg.toFixed(1)}°`;
    document.getElementById('tgt-elevation-overlay').textContent = `${telemetry.target.true_elevation_deg > 0 ? '+' : ''}${telemetry.target.true_elevation_deg.toFixed(1)}°`;

    const losTag = document.getElementById('los-status-tag');
    if (isOccluded) {
      losTag.textContent = 'SWIR TRACE';
      losTag.className = 'tag-tracer font-bold';
    } else {
      losTag.textContent = 'VALID';
      losTag.className = 'tag-lock font-bold';
    }
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate(timestamp = performance.now()) {
    requestAnimationFrame((t) => this.animate(t));

    // Strict 60 FPS Cap Pacing
    if (!this.lastRenderTime) this.lastRenderTime = timestamp;
    const elapsed = timestamp - this.lastRenderTime;
    if (elapsed < this.frameInterval - 0.75) {
      return;
    }
    this.lastRenderTime = timestamp - (elapsed % this.frameInterval);

    const elapsedTime = this.clock.getElapsedTime();

    // Wind & Aerodynamic Physics
    const windSpeed = Math.max(0.5, this.windIntensity);
    const windDirAngle = 0.55; // Wind blowing from SW to NE (~31.5 degrees)
    const windDirX = Math.cos(windDirAngle);
    const windDirY = Math.sin(windDirAngle);
    
    // Anemometer rotational velocity proportional to wind speed
    const anemometerSpeed = 0.04 + (windSpeed * 0.08);
    this.anemometerRotors.forEach(r => {
      r.rotation.z += anemometerSpeed;
    });

    // Dynamic Windsock lift & heading
    if (this.windsockMount) {
      this.windsockMount.rotation.z = THREE.MathUtils.lerp(this.windsockMount.rotation.z, windDirAngle, 0.05);
      const windForce = Math.min(1.0, windSpeed / 10.0);
      const lift = windForce * 0.82 + Math.sin(elapsedTime * 4.0) * (0.04 + windForce * 0.08);
      if (this.windsockCone) {
        this.windsockCone.rotation.y = lift;
      }
    }

    // Dynamic Swaying Trees & Foliage bending with wind force
    const windBend = (windSpeed / 15.0) * 0.18; // Base aerodynamic drag tilt
    const swayFreq = 1.4 + windSpeed * 0.18;
    this.swayingTrees.forEach((item) => {
      const gust = Math.sin(elapsedTime * swayFreq + item.phase) * (0.02 + windBend * 0.5);
      const totalSway = windBend + gust;
      
      if (item.target) {
        if (item.type === 'palm') {
          item.target.rotation.x = totalSway * windDirX * 1.3;
          item.target.rotation.y = totalSway * windDirY * 1.3;
        } else if (item.type === 'trunk') {
          item.target.rotation.x = totalSway * windDirX * 0.6;
          item.target.rotation.y = totalSway * windDirY * 0.6;
        } else if (item.type === 'casuarina') {
          item.target.rotation.x = totalSway * windDirX * 0.85;
          item.target.rotation.y = totalSway * windDirY * 0.85;
        } else {
          item.target.rotation.x = totalSway * windDirX;
          item.target.rotation.y = totalSway * windDirY;
        }
      }
    });

    // Dynamic Wind Stream Vector Streaks rushing across the scene
    if (this.windStreamLines && this.windStreamLines.geometry) {
      const posAttr = this.windStreamLines.geometry.attributes.position;
      const positions = posAttr.array;
      const speed = (5.0 + windSpeed * 7.5) * 0.16;
      
      for (let i = 0; i < this.windParticleCount; i++) {
        positions[i * 6] += windDirX * speed;
        positions[i * 6 + 1] += windDirY * speed;
        positions[i * 6 + 3] += windDirX * speed;
        positions[i * 6 + 4] += windDirY * speed;

        // Wrap around bounds
        if (positions[i * 6] > 420 || positions[i * 6 + 1] > 420) {
          const rx = -420 + Math.random() * 320;
          const ry = -420 + Math.random() * 320;
          const rz = 8 + Math.random() * 140;
          const sLen = 8 + Math.random() * 14;
          positions[i * 6] = rx;
          positions[i * 6 + 1] = ry;
          positions[i * 6 + 2] = rz;
          positions[i * 6 + 3] = rx + sLen * windDirX;
          positions[i * 6 + 4] = ry + sLen * windDirY;
          positions[i * 6 + 5] = rz;
        }
      }
      posAttr.needsUpdate = true;
      
      if (this.windStreakMat) {
        this.windStreakMat.opacity = Math.min(0.75, 0.12 + (windSpeed / 20.0) * 0.55);
      }
    }

    // Dynamic Ocean Waves & Coastal Surf reacting to wind
    if (this.oceanMesh) {
      this.oceanMesh.position.z = -1.2 + Math.sin(elapsedTime * (1.2 + windSpeed * 0.1)) * (0.15 + windSpeed * 0.02);
    }
    if (this.surfMesh) {
      this.surfMesh.position.z = -0.6 + Math.sin(elapsedTime * (2.0 + windSpeed * 0.15)) * (0.08 + windSpeed * 0.015);
      if (this.surfMesh.material) {
        this.surfMesh.material.opacity = 0.45 + Math.sin(elapsedTime * 2.5) * 0.25;
      }
    }

    // 1. Animate 3 Default Ambient Clouds (Always in sky during normal atmosphere)
    if (this.ambientDefaultClouds && this.ambientDefaultClouds.length > 0) {
      this.ambientDefaultClouds.forEach((cluster, idx) => {
        const udata = cluster.userData;
        if (!udata) return;

        const driftX = Math.sin(elapsedTime * udata.driftSpeed + udata.driftPhase) * 25;
        const driftY = Math.cos(elapsedTime * udata.driftSpeed * 0.8 + udata.driftPhase) * 20;
        const driftZ = Math.sin(elapsedTime * 0.3 + idx) * 4;

        const targetPos = new THREE.Vector3(
          udata.defaultPos.x + driftX,
          udata.defaultPos.y + driftY,
          udata.defaultPos.z + driftZ
        );

        cluster.position.lerp(targetPos, 0.04);
        const targetScale = udata.baseScale || 1.2;
        cluster.scale.set(targetScale, targetScale, targetScale);

        cluster.children.forEach(c => {
          if (c.material) {
            c.material.transparent = true;
            c.material.opacity = this.isOccludedVisual ? 0.70 : 0.85;
          }
        });
      });
    }

    // 2. Animate 24 Full-Sky Storm Front Clusters (Blanket the whole sky on occlusion)
    if (this.stormFrontClouds && this.stormFrontClouds.length > 0) {
      const isOcc = this.isOccludedVisual;
      this.stormFrontClouds.forEach((cluster, idx) => {
        const udata = cluster.userData;
        if (!udata) return;

        if (isOcc) {
          // When OCCLUSION is active: massive storm clouds roll in and blanket the WHOLE sky canopy
          const waveX = Math.sin(elapsedTime * udata.driftSpeed + udata.driftPhase) * 16;
          const waveY = Math.cos(elapsedTime * udata.driftSpeed * 0.7 + udata.driftPhase) * 16;
          const waveZ = Math.sin(elapsedTime * 0.4 + idx * 0.4) * 5;

          const targetPos = new THREE.Vector3(
            udata.stormPos.x + waveX,
            udata.stormPos.y + waveY,
            udata.stormPos.z + waveZ
          );

          // Fast fluid convergence across the whole sky
          cluster.position.lerp(targetPos, 0.08);

          // Scale up to massive puffy volumetric storm cloud volume
          const targetScale = udata.baseScale || 1.8;
          cluster.scale.set(
            THREE.MathUtils.lerp(cluster.scale.x, targetScale, 0.09),
            THREE.MathUtils.lerp(cluster.scale.y, targetScale, 0.09),
            THREE.MathUtils.lerp(cluster.scale.z, targetScale, 0.09)
          );

          cluster.children.forEach(c => {
            if (c.material) {
              c.material.transparent = true;
              c.material.opacity = THREE.MathUtils.lerp(c.material.opacity, 0.75, 0.08);
            }
          });
        } else {
          // When CLEAR SKY (default): storm clouds disperse outward to the distant horizon
          const driftX = Math.sin(elapsedTime * 0.08 + udata.driftPhase) * 20;
          const driftY = Math.cos(elapsedTime * 0.06 + udata.driftPhase) * 20;

          const targetPos = new THREE.Vector3(
            udata.restPos.x + driftX,
            udata.restPos.y + driftY,
            udata.restPos.z
          );

          cluster.position.lerp(targetPos, 0.04);

          // Shrink down and fade out at horizon
          cluster.scale.set(
            THREE.MathUtils.lerp(cluster.scale.x, 0.02, 0.06),
            THREE.MathUtils.lerp(cluster.scale.y, 0.02, 0.06),
            THREE.MathUtils.lerp(cluster.scale.z, 0.02, 0.06)
          );

          cluster.children.forEach(c => {
            if (c.material) {
              c.material.transparent = true;
              c.material.opacity = THREE.MathUtils.lerp(c.material.opacity, 0.0, 0.08);
            }
          });
        }
      });
    }

    if (this.cameraMode === 'free') {
      if (this.controls) this.controls.update();
    } else if (this.cameraMode === 'follow') {
      const vel = this.lastTargetVel;
      const velLen = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1]);
      const heading = velLen > 0.5 ? Math.atan2(vel[1], vel[0]) : Math.atan2(this.lastTargetPos.y, this.lastTargetPos.x) + Math.PI / 2;
      const dist = 68;
      const height = 28;
      const desiredPos = new THREE.Vector3(
        this.lastTargetPos.x - Math.cos(heading) * dist,
        this.lastTargetPos.y - Math.sin(heading) * dist,
        this.lastTargetPos.z + height
      );
      this.camera.position.lerp(desiredPos, 0.12);
      this.currentLookTarget.lerp(this.lastTargetPos, 0.18);
      this.camera.lookAt(this.currentLookTarget);
    } else if (this.cameraMode === 'terminal') {
      this.camera.position.set(0, 0, 38);
      this.currentLookTarget.lerp(this.lastTargetPos, 0.18);
      this.camera.lookAt(this.currentLookTarget);
    } else if (this.cameraMode === 'satellite') {
      const satPos = new THREE.Vector3(120, -780, 840);
      this.camera.position.lerp(satPos, 0.08);
      const satCenter = new THREE.Vector3(0, 0, 40);
      this.currentLookTarget.lerp(satCenter, 0.1);
      this.camera.lookAt(this.currentLookTarget);
    } else if (this.cameraMode === 'recon') {
      const reconPos = new THREE.Vector3(0, 0, 820);
      this.camera.position.lerp(reconPos, 0.08);
      const nadirCenter = new THREE.Vector3(0, 0, 0);
      this.currentLookTarget.lerp(nadirCenter, 0.1);
      this.camera.lookAt(this.currentLookTarget);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

class VirtualCameraView {
  constructor(containerId, scene) {
    this.container = document.getElementById(containerId);
    this.scene = scene;
    this.width = this.container.clientWidth || 600;
    this.height = this.container.clientHeight || 450;
    this.zoomLevel = 1.0;
    this.sensorMode = 'vis';

    this.camera = new THREE.PerspectiveCamera(45.0, this.width / this.height, 0.2, 8000);
    this.camera.position.set(0, 0, 38);
    this.camera.up.set(0, 0, 1);

    this.targetFps = 60.0;
    this.frameInterval = 1000.0 / 60.0;
    this.lastRenderTime = 0;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    this.container.classList.add('sensor-mode-vis');

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  setZoom(zoomFactor) {
    this.zoomLevel = zoomFactor;
    const baseFov = 45.0;
    this.camera.fov = baseFov / zoomFactor;
    this.camera.updateProjectionMatrix();

    const fovEl = document.getElementById('hud-fov-val');
    if (fovEl) fovEl.textContent = `${this.camera.fov.toFixed(1)}°`;

    const tagEl = document.getElementById('hud-sensor-tag');
    if (tagEl) tagEl.textContent = `EO ${this.sensorMode.toUpperCase()} / ${zoomFactor}X`;
  }

  setSensorMode(mode) {
    this.sensorMode = mode;
    this.container.className = 'virtual-camera-3d-layer';
    this.container.classList.add(`sensor-mode-${mode}`);

    const tagEl = document.getElementById('hud-sensor-tag');
    if (tagEl) tagEl.textContent = `EO ${mode.toUpperCase()} / ${this.zoomLevel}X`;
  }

  update(telemetry) {
    if (!telemetry) return;

    if (telemetry.camera?.fov_h_deg && this.zoomLevel === 1.0) {
      if (Math.abs(this.camera.fov - telemetry.camera.fov_h_deg) > 0.1) {
        this.camera.fov = telemetry.camera.fov_h_deg;
        this.camera.updateProjectionMatrix();

        const fovEl = document.getElementById('hud-fov-val');
        if (fovEl) fovEl.textContent = `${this.camera.fov.toFixed(1)}°`;
      }
    }

    if (telemetry.gimbal) {
      const azRad = THREE.MathUtils.degToRad(telemetry.gimbal.gimbal_azimuth_deg);
      const elRad = THREE.MathUtils.degToRad(telemetry.gimbal.gimbal_elevation_deg);

      const dirX = Math.sin(azRad) * Math.cos(elRad);
      const dirY = Math.cos(azRad) * Math.cos(elRad);
      const dirZ = Math.sin(elRad);

      const forward = new THREE.Vector3(dirX, dirY, dirZ).normalize();
      let up = new THREE.Vector3(0, 0, 1);
      if (Math.abs(forward.dot(up)) > 0.98) {
        up = new THREE.Vector3(0, 1, 0);
      }
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      const trueUp = new THREE.Vector3().crossVectors(right, forward).normalize();

      const m = new THREE.Matrix4().makeBasis(right, trueUp, forward.clone().negate());
      this.camera.quaternion.setFromRotationMatrix(m);
      this.camera.position.set(0, 0, 38);
    }
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate(timestamp = performance.now()) {
    requestAnimationFrame((t) => this.animate(t));

    // Strict 60 FPS Cap Pacing
    if (!this.lastRenderTime) this.lastRenderTime = timestamp;
    const elapsed = timestamp - this.lastRenderTime;
    if (elapsed < this.frameInterval - 0.75) {
      return;
    }
    this.lastRenderTime = timestamp - (elapsed % this.frameInterval);

    this.renderer.render(this.scene, this.camera);
  }
}

class TacticalMinimap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this.scale = 0.16;
  }

  render(telemetry) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#06080B';
    ctx.beginPath();
    ctx.moveTo(w - 25, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(w - 30, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1F2026';
    ctx.fillRect(15, cy - 8, w - 40, 16);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    [20, 38, 54].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(cx, 4); ctx.lineTo(cx, h - 4);
    ctx.moveTo(4, cy); ctx.lineTo(w - 4, cy);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (!telemetry || !telemetry.target) return;

    const pos = telemetry.target.position;
    const tx = cx + pos[0] * this.scale;
    const ty = cy - pos[1] * this.scale;

    const isLocked = telemetry.gimbal?.is_locked;
    const isOccluded = telemetry.target?.is_occluded;
    ctx.strokeStyle = isOccluded ? '#00E5FF' : (isLocked ? '#FFFFFF' : '#EF4444');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillStyle = isOccluded ? '#00E5FF' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const lat = (13.7199 + pos[1] * 0.000009).toFixed(4);
    const lon = (80.2305 + pos[0] * 0.000009).toFixed(4);
    const gpsEl = document.getElementById('gps-latlong');
    if (gpsEl) gpsEl.textContent = `${lat}°N ${lon}°E`;

    const mmRange = document.getElementById('mm-range');
    if (mmRange) mmRange.textContent = `${telemetry.target.distance ? telemetry.target.distance.toFixed(0) : '250'}m`;
    const mmBearing = document.getElementById('mm-bearing');
    if (mmBearing) mmBearing.textContent = `${telemetry.target.true_azimuth_deg ? telemetry.target.true_azimuth_deg.toFixed(0) : '0'}°`;
    const mmAlt = document.getElementById('mm-alt');
    if (mmAlt) mmAlt.textContent = `${pos[2].toFixed(0)}m`;
  }
}

class EOIRTrackingHUD {
  constructor(canvasId, vcam) {
    this.canvas = document.getElementById(canvasId);
    this.vcam = vcam;
    this.ctx = this.canvas.getContext('2d');
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this.calibrationStartTime = 0;
    this.calibrationDuration = 3000;
    this.calibrationEndTime = 0;
  }

  triggerCalibration(durationMs = 3000) {
    this.calibrationDuration = durationMs;
    this.calibrationStartTime = performance.now();
    this.calibrationEndTime = this.calibrationStartTime + durationMs;
  }

  render(telemetry) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const isLocked = telemetry?.gimbal?.is_locked;
    const isOccluded = telemetry?.target?.is_occluded;
    const errMrad = telemetry?.gimbal?.total_error_mrad || 0;
    const currentAz = telemetry?.gimbal?.gimbal_azimuth_deg || 142.5;
    const currentEl = telemetry?.gimbal?.gimbal_elevation_deg || 28.4;
    const range = telemetry?.target?.distance || 250.0;
    const nowT = performance.now();

    // Check if terminal is undergoing realistic reset/calibration sweep (3.0s full cycle)
    const isCalibrating = this.calibrationEndTime && nowT < this.calibrationEndTime;
    const elapsedCalibMs = isCalibrating ? (nowT - this.calibrationStartTime) : 0;
    const calibProg = isCalibrating ? Math.min(1.0, Math.max(0.0, elapsedCalibMs / (this.calibrationDuration || 3000))) : 1.0;

    let reticleColor = '#FFFFFF';
    if (isCalibrating) reticleColor = calibProg < 0.33 ? '#F59E0B' : (calibProg < 0.60 ? '#38BDF8' : '#00E5FF');
    else if (isOccluded) reticleColor = '#00E5FF';
    else if (isLocked) reticleColor = '#10B981';
    else if (errMrad <= 15.0) reticleColor = '#EAB308';

    const bracketSize = 40;
    ctx.strokeStyle = isCalibrating ? (calibProg < 0.33 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(0, 229, 255, 0.7)') : (isOccluded ? 'rgba(0, 229, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)');
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(60, 60 + bracketSize); ctx.lineTo(60, 60); ctx.lineTo(60 + bracketSize, 60);
    ctx.moveTo(w - 60 - bracketSize, 60); ctx.lineTo(w - 60, 60); ctx.lineTo(w - 60, 60 + bracketSize);
    ctx.moveTo(60, h - 60 - bracketSize); ctx.lineTo(60, h - 60); ctx.lineTo(60 + bracketSize, h - 60);
    ctx.moveTo(w - 60 - bracketSize, h - 60); ctx.lineTo(w - 60, h - 60); ctx.lineTo(w - 60, h - 60 - bracketSize);
    ctx.stroke();

    ctx.strokeStyle = isCalibrating ? 'rgba(56, 189, 248, 0.5)' : (isOccluded ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 255, 255, 0.35)');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 360, 52); ctx.lineTo(cx + 360, 52);
    ctx.stroke();

    ctx.font = 'bold 16px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    const azStart = Math.floor(currentAz - 30);
    const azEnd = Math.ceil(currentAz + 30);

    for (let a = azStart; a <= azEnd; a++) {
      if (a % 5 === 0) {
        const offsetPx = (a - currentAz) * 12;
        if (Math.abs(offsetPx) <= 350) {
          const isMajor = a % 15 === 0;
          ctx.beginPath();
          ctx.moveTo(cx + offsetPx, 52);
          ctx.lineTo(cx + offsetPx, 52 + (isMajor ? 12 : 6));
          ctx.stroke();

          if (isMajor) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.fillText(`${(a + 360) % 360}°`, cx + offsetPx, 44);
          }
        }
      }
    }

    ctx.fillStyle = isCalibrating ? (calibProg < 0.33 ? '#F59E0B' : (calibProg < 0.60 ? '#38BDF8' : '#00E5FF')) : (isOccluded ? '#00E5FF' : (isLocked ? '#10B981' : '#FFFFFF'));
    ctx.beginPath();
    ctx.moveTo(cx, 56); ctx.lineTo(cx - 7, 68); ctx.lineTo(cx + 7, 68);
    ctx.closePath();
    ctx.fill();

    // Elevation ladder
    ctx.beginPath();
    ctx.moveTo(w - 70, cy - 240); ctx.lineTo(w - 70, cy + 240);
    ctx.stroke();

    const elStart = Math.floor(currentEl - 20);
    const elEnd = Math.ceil(currentEl + 20);

    for (let e = elStart; e <= elEnd; e++) {
      if (e % 5 === 0) {
        const offsetPy = (currentEl - e) * 12;
        if (Math.abs(offsetPy) <= 230) {
          const isMajor = e % 10 === 0;
          ctx.beginPath();
          ctx.moveTo(w - 70, cy + offsetPy);
          ctx.lineTo(w - 70 - (isMajor ? 12 : 6), cy + offsetPy);
          ctx.stroke();

          if (isMajor) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.fillText(`${e > 0 ? '+' : ''}${e}°`, w - 96, cy + offsetPy + 5);
          }
        }
      }
    }

    ctx.fillStyle = isCalibrating ? (calibProg < 0.33 ? '#F59E0B' : (calibProg < 0.60 ? '#38BDF8' : '#00E5FF')) : (isOccluded ? '#00E5FF' : (isLocked ? '#10B981' : '#FFFFFF'));
    ctx.beginPath();
    ctx.moveTo(w - 66, cy); ctx.lineTo(w - 54, cy - 7); ctx.lineTo(w - 54, cy + 7);
    ctx.closePath();
    ctx.fill();

    // 3-Second Precision Calibration & Tracing Animation Overlay
    if (isCalibrating) {
      const phaseColor = calibProg < 0.33 ? '#F59E0B' : (calibProg < 0.60 ? '#38BDF8' : '#00E5FF');

      ctx.save();
      ctx.strokeStyle = phaseColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 65 + Math.sin(nowT * 0.012) * 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(nowT * 0.004);
      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = phaseColor;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, 115, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "Cinzel", "Times New Roman", serif';
      ctx.fillStyle = phaseColor;

      let phaseTitle = '[PHASE I: PHYSICAL RE-HOMING & ZERO-INDEXING]';
      let phaseSub1 = `ENCODER HOMING: AZ 0.00° / EL +20.00° | CMOS ZERO-CAL: ${(Math.min(1.0, calibProg / 0.33) * 100).toFixed(0)}%`;
      let phaseSub2 = 'EKF 6-DOF STATE BUFFERS FLUSHED | SYNCHRONIZING DIGITAL TWIN';

      if (calibProg >= 0.33 && calibProg < 0.60) {
        const p2 = Math.min(1.0, (calibProg - 0.33) / 0.27);
        phaseTitle = '[PHASE II: WIDE-ANGLE AI DETECTION & SLEW]';
        phaseSub1 = `AI OPTICAL BEACON ACQUISITION | SLEWING TO DRONE: ${(p2 * 100).toFixed(0)}%`;
        phaseSub2 = 'HIGH-SPEED GIMBAL SLEW ENGAGED | ACQUIRING OPTICAL BORESIGHT';
      } else if (calibProg >= 0.60) {
        const p3 = Math.min(1.0, (calibProg - 0.60) / 0.40);
        phaseTitle = '[PHASE III: TEMPORAL BEACON INTEGRATION & TRACE]';
        phaseSub1 = `OPTICAL BEACON IN FOV | CLOSED-LOOP TRACING: ${(p3 * 100).toFixed(0)}%`;
        phaseSub2 = 'EKF 6-DOF STATE CONVERGING | LOCKING OPTICAL TRACKING AXIS';
      }

      ctx.fillText(phaseTitle, cx, cy - 135);

      ctx.font = 'bold 15px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(phaseSub1, cx, cy + 145);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(phaseSub2, cx, cy + 170);

      // Sequence Countdown & Progress Bar
      const remainingSec = Math.max(0, ((this.calibrationDuration || 3000) - elapsedCalibMs) / 1000).toFixed(1);
      const barW = 340;
      const barH = 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(cx - barW / 2, cy + 190, barW, barH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - barW / 2, cy + 190, barW, barH);
      ctx.fillStyle = phaseColor;
      ctx.fillRect(cx - barW / 2, cy + 190, barW * calibProg, barH);

      ctx.font = 'bold 13px "IBM Plex Mono", monospace';
      ctx.fillStyle = phaseColor;
      ctx.fillText(`TRACE & LOCK SEQUENCE: ${(calibProg * 100).toFixed(0)}% (T-${remainingSec}s)`, cx, cy + 218);

      ctx.restore();
    }

    // Optical reticle crosshairs
    const cSize = 22;
    const cGap = 7;
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(cx - cSize, cy); ctx.lineTo(cx - cGap, cy);
    ctx.moveTo(cx + cGap, cy); ctx.lineTo(cx + cSize, cy);
    ctx.moveTo(cx, cy - cSize); ctx.lineTo(cx, cy - cGap);
    ctx.moveTo(cx, cy + cGap); ctx.lineTo(cx, cy + cSize);
    ctx.stroke();

    ctx.strokeStyle = isCalibrating ? '#F59E0B' : (isOccluded ? 'rgba(0, 229, 255, 0.4)' : (isLocked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.2)'));
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.stroke();

    const zoom = this.vcam ? this.vcam.zoomLevel : 1.0;
    const fovDeg = (this.vcam ? this.vcam.camera.fov : 45.0);
    const mradRadius = Math.max(35, Math.min(460, ((8.72 / 1000) / THREE.MathUtils.degToRad(fovDeg)) * h));

    ctx.strokeStyle = isOccluded ? 'rgba(0, 229, 255, 0.8)' : (isLocked ? 'rgba(16, 185, 129, 0.8)' : 'rgba(255, 255, 255, 0.4)');
    ctx.lineWidth = (isLocked || isOccluded) ? 2.5 : 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, mradRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    let screenPos = null;
    if (telemetry?.target?.position && this.vcam?.camera) {
      const tPos = new THREE.Vector3(telemetry.target.position[0], telemetry.target.position[1], telemetry.target.position[2]);
      const proj = tPos.project(this.vcam.camera);
      const su = (proj.x * 0.5 + 0.5) * w;
      const sv = (-(proj.y * 0.5) + 0.5) * h;
      const inFront = proj.z > 0 && proj.z < 1;
      screenPos = { u: su, v: sv, inFront, inView: inFront && su >= -100 && su <= w + 100 && sv >= -100 && sv <= h + 100 };
    }

    if (screenPos && screenPos.inFront && !isCalibrating) {
      const u = screenPos.u;
      const v = screenPos.v;
      const bSize = Math.max(28, Math.min(160, 48 * zoom * (180 / Math.max(40, range))));
      const isAcquiring = telemetry?.ai?.detection_state === 'ACQUIRING' || (telemetry?.ai?.detected === false && (telemetry?.ai?.acquisition_progress_pct || 0) > 0);
      const acqProgress = telemetry?.ai?.acquisition_progress_pct || 0;

      ctx.strokeStyle = isOccluded ? '#00E5FF' : (isLocked ? '#10B981' : (isAcquiring ? '#F59E0B' : '#EAB308'));
      ctx.lineWidth = isOccluded ? 2.5 : 2.0;

      const cL = Math.max(8, bSize * 0.3);
      if (isOccluded || isAcquiring) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(u - bSize / 2, v - bSize / 2 + cL);
      ctx.lineTo(u - bSize / 2, v - bSize / 2);
      ctx.lineTo(u - bSize / 2 + cL, v - bSize / 2);

      ctx.moveTo(u + bSize / 2 - cL, v - bSize / 2);
      ctx.lineTo(u + bSize / 2, v - bSize / 2);
      ctx.lineTo(u + bSize / 2, v - bSize / 2 + cL);

      ctx.moveTo(u - bSize / 2, v + bSize / 2 - cL);
      ctx.lineTo(u - bSize / 2, v + bSize / 2);
      ctx.lineTo(u - bSize / 2 + cL, v + bSize / 2);

      ctx.moveTo(u + bSize / 2 - cL, v + bSize / 2);
      ctx.lineTo(u + bSize / 2, v + bSize / 2);
      ctx.lineTo(u + bSize / 2, v + bSize / 2 - cL);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isAcquiring) {
        // Render pulsating camera acquisition reticle
        const pulse = (nowT * 0.003) % 1.0;
        ctx.strokeStyle = `rgba(245, 158, 11, ${Math.max(0.2, 1.0 - pulse)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(u, v, bSize * 0.5 + pulse * 28, 0, Math.PI * 2);
        ctx.stroke();

        // Mini acquisition progress bar on bounding box
        ctx.fillStyle = 'rgba(24, 24, 27, 0.7)';
        ctx.fillRect(u - bSize / 2, v + bSize / 2 + 8, bSize, 6);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(u - bSize / 2, v + bSize / 2 + 8, bSize * (acqProgress / 100.0), 6);
      }

      if (isOccluded) {
        const pulse1 = (nowT * 0.0025) % 1.0;
        const pulse2 = ((nowT * 0.0025) + 0.5) % 1.0;
        
        ctx.strokeStyle = `rgba(0, 229, 255, ${Math.max(0, 1.0 - pulse1)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(u, v, bSize * 0.5 + pulse1 * 36, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1.0 - pulse2)})`;
        ctx.beginPath();
        ctx.arc(u, v, bSize * 0.5 + pulse2 * 36, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(u, v);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const conf = telemetry.ai?.confidence ? (telemetry.ai.confidence * 100).toFixed(1) : '98.8';
      ctx.fillStyle = isOccluded ? '#00E5FF' : (isLocked ? '#10B981' : (isAcquiring ? '#F59E0B' : '#EAB308'));
      ctx.font = 'bold 18px "Cinzel", "IBM Plex Sans", sans-serif';
      ctx.textAlign = 'center';
      let boxLabel = isOccluded ? `AI: SWIR TRACE ECHO [LOCKED ${conf}%]` : `YOLOv8 [${telemetry.ai?.class_name || 'UAV_BEACON'}] ${conf}%`;
      if (isAcquiring) {
        boxLabel = `ACQUIRING BEACON ${acqProgress.toFixed(0)}% [${conf}%]`;
      }
      ctx.fillText(boxLabel, u, v - bSize / 2 - 12);

      if (isOccluded) {
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 13px "IBM Plex Mono", monospace';
        ctx.fillText('CLOUD PENETRATION 98.6% | ECHO DELAY: 1.6µs', u, v + bSize / 2 + 18);
      }

      if (!isOccluded) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(u, v);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const vel = telemetry.target?.velocity || [0, 0, 0];
      const leadLen = Math.min(80, Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1]) * 3.5 * zoom);
      const leadAngle = Math.atan2(vel[1], vel[0]);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(u, v);
      ctx.lineTo(u + Math.cos(leadAngle) * leadLen, v - Math.sin(leadAngle) * leadLen);
      ctx.stroke();
    }

    if (telemetry?.kalman && screenPos && screenPos.inFront && !isCalibrating) {
      const ku = screenPos.u + (Math.random() * 2 - 1);
      const kv = screenPos.v + (Math.random() * 2 - 1);
      const sig = telemetry.kalman.position_uncertainty_px || 1.4;

      ctx.strokeStyle = isOccluded ? '#00E5FF' : '#38BDF8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(ku, kv, Math.max(14, sig * 4), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isOccluded ? '#00E5FF' : '#38BDF8';
      ctx.font = 'bold 16px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(isOccluded ? `SWIR TRACER ±${sig.toFixed(1)}px` : `EKF EST ±${sig.toFixed(1)}px`, ku + 18, kv + 5);
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Cinzel", "Times New Roman", serif';

    const isAcquiring = telemetry?.ai?.detection_state === 'ACQUIRING' || (telemetry?.ai?.detected === false && (telemetry?.ai?.acquisition_progress_pct || 0) > 0);
    const acqProgress = telemetry?.ai?.acquisition_progress_pct || 0;

    if (isCalibrating) {
      if (calibProg < 0.33) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('[SYSTEM RESET: OPTICAL RE-HOMING & BORESIGHT ZEROING (T-3.0s)]', cx, h - 88);
      } else if (calibProg < 0.60) {
        ctx.fillStyle = '#38BDF8';
        ctx.fillText('[WIDE-ANGLE AI SENSOR ACTIVE: SLEWING TOWARDS UAV BEARING (T-2.0s)]', cx, h - 88);
      } else {
        ctx.fillStyle = '#00E5FF';
        ctx.fillText('[OPTICAL BEACON ACQUIRED: CENTERING & TRACING UAV (T-1.0s)]', cx, h - 88);
      }
    } else if (isOccluded) {
      ctx.fillStyle = '#00E5FF';
      ctx.fillText('[ACTIVE SWIR TRACE PROBE ENGAGED: DRONE ECHO RETURN LOCKED THROUGH CLOUD]', cx, h - 88);
    } else if (isLocked) {
      ctx.fillStyle = '#10B981';
      ctx.fillText(`[COARSE OPTICAL ALIGNMENT LOCKED: ${errMrad.toFixed(2)} mrad]`, cx, h - 88);
    } else if (isAcquiring) {
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`[CAMERA AI ACQUIRING OPTICAL BEACON: ${acqProgress.toFixed(0)}% (SENSOR EXPOSURE INTEGRATION)]`, cx, h - 88);
    } else if (telemetry?.kalman?.state_label === 'SEARCHING' || telemetry?.kalman?.state_label === 'LOST_SEARCHING') {
      ctx.fillStyle = '#EAB308';
      ctx.fillText(`[ACQUISITION SEARCH: WIDE-AREA SKY SCANNING (OFFSET ${errMrad.toFixed(1)} mrad)]`, cx, h - 88);
    } else {
      ctx.fillStyle = '#EAB308';
      ctx.fillText(`[ACQUISITION SEARCHING: BORESIGHT OFFSET ${errMrad.toFixed(2)} mrad]`, cx, h - 88);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = 'bold 15px "IBM Plex Mono", monospace';
    ctx.fillText('ISRO SDSC SHAR / FSOC TERMINAL PTM-01', 75, h - 75);
    ctx.fillText(`OPTICAL COUDÉ PATH | FL: 1200mm | F/4.0`, 75, h - 55);

    ctx.textAlign = 'right';
    ctx.fillText(`SENSOR: ${(this.vcam ? this.vcam.sensorMode : 'vis').toUpperCase()} | ZOOM: ${this.vcam ? this.vcam.zoomLevel : 1}X`, w - 75, h - 75);
    ctx.fillText(`FOV: ${fovDeg.toFixed(1)}° | RANGE: ${range.toFixed(1)}m`, w - 75, h - 55);
  }
}

class EngineeringEventFeed {
  constructor(listId) {
    this.list = document.getElementById(listId);
    this.maxEvents = 60;
  }

  logEvent(type, tag, message, simTime = 0) {
    if (!this.list) return;

    const mins = Math.floor(simTime / 60);
    const secs = (simTime % 60).toFixed(1);
    const timeStr = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}]`;

    const item = document.createElement('div');
    item.className = 'event-item';

    const tagClass = {
      lock: 'tag-lock',
      warn: 'tag-alert',
      ai: 'tag-ai',
      sys: 'tag-sys',
      wind: 'tag-wind'
    }[type] || 'tag-sys';

    item.innerHTML = `
      <span class="log-time">${timeStr}</span>
      <span class="log-tag ${tagClass}">${tag}</span>
      <span class="log-msg">${message}</span>
    `;

    this.list.insertBefore(item, this.list.firstChild);

    while (this.list.children.length > this.maxEvents) {
      this.list.removeChild(this.list.lastChild);
    }
  }

  clear() {
    if (this.list) this.list.innerHTML = '';
  }
}

class TelemetryConsole {
  constructor(timeline) {
    this.timeline = timeline;
    this.lastTrackState = 'SEARCH';
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.currentFps = 60.0;
    this.maxRecordedError = 0.0;
    this.bufferSize = 60;
    this.errorHistory = [];

    this.initChart();
  }

  initChart() {
    const canvas = document.getElementById('error-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Create glowing area fill gradient beneath pointing error curve
    const gradient = ctx.createLinearGradient(0, 0, 0, 140);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.08)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    this.chartData = {
      labels: Array(this.bufferSize).fill(''),
      datasets: [
        {
          label: 'Pointing Error (mrad)',
          data: Array(this.bufferSize).fill(0),
          borderColor: '#06B6D4',
          backgroundColor: gradient,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.28
        },
        {
          label: 'ISRO Coarse Limit (8.72 mrad)',
          data: Array(this.bufferSize).fill(8.72),
          borderColor: '#EF4444',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    };

    this.chart = new Chart(ctx, {
      type: 'line',
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false
            },
            ticks: { display: false }
          },
          y: {
            min: 0,
            suggestedMax: 15,
            grid: {
              color: 'rgba(255, 255, 255, 0.07)',
              drawBorder: false
            },
            ticks: {
              color: '#94A3B8',
              font: { size: 9, family: 'IBM Plex Mono, monospace', weight: '600' },
              stepSize: 4,
              callback: (val) => `${val} mrad`
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(9, 9, 11, 0.92)',
            titleColor: '#FFFFFF',
            bodyColor: '#A1A1AA',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            titleFont: { size: 10, family: 'IBM Plex Mono, monospace' },
            bodyFont: { size: 10, family: 'IBM Plex Mono, monospace' },
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} mrad`
            }
          }
        }
      }
    });
  }

  resetChart() {
    this.maxRecordedError = 0.0;
    this.errorHistory = [];
    if (this.chart) {
      this.chart.data.datasets[0].data = Array(this.bufferSize).fill(0);
      this.chart.data.datasets[0].borderColor = '#06B6D4';
      this.chart.update('none');
    }
    const currErr = document.getElementById('chart-curr-err');
    const rmsErr = document.getElementById('chart-rms-err');
    const maxErr = document.getElementById('chart-max-err');
    if (currErr) {
      currErr.textContent = '0.00 mrad';
      currErr.style.color = '#FFFFFF';
    }
    if (rmsErr) rmsErr.textContent = '0.00 mrad';
    if (maxErr) maxErr.textContent = '0.00 mrad';
  }

  update(data) {
    if (!data) return;

    const simTime = data.timestamp || 0;
    const mins = Math.floor(simTime / 60);
    const secs = (simTime % 60).toFixed(2);
    const navSimTime = document.getElementById('nav-sim-time');
    if (navSimTime) navSimTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;

    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFrameTime >= 1000) {
      this.currentFps = (this.frameCount * 1000) / (now - this.lastFrameTime);
      this.frameCount = 0;
      this.lastFrameTime = now;
      const navFps = document.getElementById('nav-fps');
      if (navFps) navFps.textContent = this.currentFps.toFixed(1);
    }

    const isLocked = data.gimbal?.is_locked;
    const isOccluded = data.target?.is_occluded;
    const errMrad = (typeof data.gimbal?.total_error_mrad === 'number') ? data.gimbal.total_error_mrad : 0;
    const errDeg = (typeof data.gimbal?.total_error_deg === 'number') ? data.gimbal.total_error_deg : (errMrad * 180.0 / Math.PI / 1000.0);

    const p1 = document.getElementById('pipe-step-1');
    const p2 = document.getElementById('pipe-step-2');
    const p3 = document.getElementById('pipe-step-3');
    const p4 = document.getElementById('pipe-step-4');
    const p5 = document.getElementById('pipe-step-5');

    if (p1) p1.className = 'pipeline-step step-active';
    if (p2) p2.className = `pipeline-step ${data.ai?.detected ? 'step-active' : ''}`;
    if (p3) p3.className = `pipeline-step ${(data.kalman?.is_initialized || isOccluded) ? 'step-active' : ''}`;
    if (p4) p4.className = `pipeline-step ${(Math.abs(data.gimbal?.slew_rate_az || 0) > 0.1 || isOccluded) ? 'step-active' : ''}`;
    if (p5) p5.className = `pipeline-step ${(isLocked || (isOccluded && errMrad <= 8.72)) ? 'step-active' : ''}`;

    let currentState = 'SEARCH';
    let stateClass = 'badge-neutral';
    let stateText = 'SEARCH';
    let stateSub = 'Awaiting target detection';

    if (isOccluded) {
      currentState = 'OCCLUDED';
      stateClass = 'badge-acq';
      stateText = 'OCCLUSION (EKF TRACK)';
      stateSub = '6-DOF trajectory extrapolation active';
    } else if (isLocked) {
      currentState = 'LOCK';
      stateClass = 'badge-lock';
      stateText = 'LOCK';
      stateSub = 'Coarse alignment established';
    } else if (data.ai?.detected) {
      if (errMrad > 8.72) {
        currentState = 'ACQUIRE';
        stateClass = 'badge-acq';
        stateText = 'ACQUIRE';
        stateSub = 'Gimbal converging on beacon';
      } else {
        currentState = 'TRACK';
        stateClass = 'badge-neutral';
        stateText = 'TRACK';
        stateSub = 'Optical target tracking';
      }
    }

    const stateBadge = document.getElementById('tracking-state-badge');
    const stateTextEl = document.getElementById('tracking-state-text');
    const stateSubEl = document.getElementById('tracking-state-sub');
    if (stateBadge) stateBadge.className = `status-badge ${stateClass}`;
    if (stateTextEl) stateTextEl.textContent = stateText;
    if (stateSubEl) stateSubEl.textContent = stateSub;

    if (this.lastTrackState !== currentState) {
      if (currentState === 'LOCK') {
        this.timeline.logEvent('lock', 'LOCK', `Coarse optical alignment established (${errMrad.toFixed(2)} mrad). 10 Gbps locked.`, simTime);
      } else if (currentState === 'OCCLUDED') {
        this.timeline.logEvent('warn', 'OCCLUSION', 'Target obscured by cloud. EKF coasting on velocity extrapolation.', simTime);
      } else if (currentState === 'ACQUIRE' && this.lastTrackState === 'OCCLUDED') {
        this.timeline.logEvent('ai', 'REACQ', 'Target visual beacon reacquired. PID servo stabilizing.', simTime);
      }
      this.lastTrackState = currentState;
    }

    const kpiErr = document.getElementById('kpi-pointing-error');
    const kpiDeg = document.getElementById('kpi-pointing-deg');
    if (kpiErr) kpiErr.textContent = errMrad.toFixed(2);
    if (kpiDeg) kpiDeg.textContent = `(${errDeg.toFixed(3)}°)`;

    const kpiLockBadge = document.getElementById('kpi-lock-status');
    const kpiMargin = document.getElementById('kpi-margin-text');
    const marginMrad = 8.72 - errMrad;

    if (kpiLockBadge && kpiMargin) {
      if (isLocked) {
        kpiLockBadge.className = 'status-badge badge-lock';
        kpiLockBadge.textContent = 'LOCK';
        kpiMargin.textContent = `Margin: +${marginMrad.toFixed(2)} mrad`;
      } else if (errMrad <= 15.0) {
        kpiLockBadge.className = 'status-badge badge-acq';
        kpiLockBadge.textContent = 'ACQUIRE';
        kpiMargin.textContent = `Deficit: ${Math.abs(marginMrad).toFixed(2)} mrad`;
      } else {
        kpiLockBadge.className = 'status-badge badge-alert';
        kpiLockBadge.textContent = 'MISALIGNED';
        kpiMargin.textContent = `Deficit: ${Math.abs(marginMrad).toFixed(2)} mrad`;
      }
    }

    const navLatency = document.getElementById('nav-latency');
    if (navLatency) navLatency.textContent = `${data.performance?.latency_ms || 4.2} ms`;

    if (data.camera) {
      const hudRange = document.getElementById('hud-range');
      const hudBeacon = document.getElementById('hud-beacon-size');
      if (hudRange && typeof data.camera.range_m === 'number') hudRange.textContent = `${data.camera.range_m.toFixed(1)} m`;
      if (hudBeacon && typeof data.camera.apparent_radius_px === 'number') hudBeacon.textContent = `${data.camera.apparent_radius_px.toFixed(1)} px`;
    }
    if (data.ai) {
      const hudConf = document.getElementById('hud-confidence');
      const vcamTag = document.getElementById('vcam-state-tag');
      if (hudConf && typeof data.ai.confidence === 'number') hudConf.textContent = `${(data.ai.confidence * 100).toFixed(1)}%`;
      if (vcamTag) {
        vcamTag.textContent = isOccluded ? 'OCCLUDED' : (data.ai.detected ? 'TRACKING' : 'SEARCHING');
        vcamTag.className = isOccluded ? 'tag-alert font-bold' : (data.ai.detected ? 'tag-lock font-bold' : 'font-bold');
      }
    }
    if (data.kalman) {
      const hudEkf = document.getElementById('hud-ekf-state');
      const hudVel = document.getElementById('hud-velocity');
      const hudSigma = document.getElementById('hud-sigma');
      if (hudEkf) hudEkf.textContent = data.kalman.state_label || '6-DOF EKF';
      if (hudVel && data.kalman.velocity_px_per_s) hudVel.textContent = `[${data.kalman.velocity_px_per_s[0]}, ${data.kalman.velocity_px_per_s[1]}] px/s`;
      if (hudSigma && typeof data.kalman.position_uncertainty_px === 'number') hudSigma.textContent = `±${data.kalman.position_uncertainty_px} px`;
    }
    if (data.gimbal) {
      const hudErrAz = document.getElementById('hud-err-az');
      const hudErrEl = document.getElementById('hud-err-el');
      const hudErrTot = document.getElementById('hud-err-total');
      const valAz = document.getElementById('val-azimuth');
      const valEl = document.getElementById('val-elevation');
      const slewAz = document.getElementById('slew-az');
      const slewEl = document.getElementById('slew-el');

      const errAzDeg = data.gimbal.error_azimuth_deg || 0;
      const errElDeg = data.gimbal.error_elevation_deg || 0;
      const gAz = data.gimbal.gimbal_azimuth_deg ?? data.gimbal.azimuth_deg ?? 0;
      const gEl = data.gimbal.gimbal_elevation_deg ?? data.gimbal.elevation_deg ?? 0;

      if (hudErrAz) hudErrAz.textContent = `${errAzDeg > 0 ? '+' : ''}${errAzDeg.toFixed(3)}°`;
      if (hudErrEl) hudErrEl.textContent = `${errElDeg > 0 ? '+' : ''}${errElDeg.toFixed(3)}°`;
      if (hudErrTot) hudErrTot.textContent = `${errMrad.toFixed(2)} mrad`;

      if (valAz) valAz.textContent = `${gAz.toFixed(1)}°`;
      if (valEl) valEl.textContent = `${gEl > 0 ? '+' : ''}${gEl.toFixed(1)}°`;
      if (slewAz) slewAz.textContent = Math.abs(data.gimbal.slew_rate_az || 0).toFixed(1);
      if (slewEl) slewEl.textContent = Math.abs(data.gimbal.slew_rate_el || 0).toFixed(1);
    }

    if (data.optics) {
      const valRssi = document.getElementById('val-rssi');
      const valPower = document.getElementById('val-power-uw');
      const valBer = document.getElementById('val-ber');
      const valSnr = document.getElementById('val-snr');
      const linkStateTag = document.getElementById('link-state-tag');
      const weatherBadge = document.getElementById('weather-badge');

      if (valRssi && typeof data.optics.rssi_dbm === 'number') valRssi.textContent = `${data.optics.rssi_dbm.toFixed(1)} dBm`;
      if (valPower && typeof data.optics.received_power_uw === 'number') valPower.textContent = data.optics.received_power_uw.toFixed(2);
      if (valBer && data.optics.ber_scientific) valBer.textContent = data.optics.ber_scientific;
      if (valSnr && typeof data.optics.snr_db === 'number') valSnr.textContent = data.optics.snr_db.toFixed(1);

      if (linkStateTag) {
        linkStateTag.textContent = `${data.optics.throughput_gbps || 0} Gbps locked`;
        linkStateTag.className = isLocked ? 'tag-lock val-mono' : 'val-mono';
      }

      if (weatherBadge && data.optics.weather) {
        weatherBadge.textContent = data.optics.weather.charAt(0).toUpperCase() + data.optics.weather.slice(1);
      }
    }

    const detConf = data.ai?.confidence ? (data.ai.confidence * 100).toFixed(1) : '0.0';
    const tqDetConf = document.getElementById('tq-det-conf');
    if (tqDetConf) tqDetConf.textContent = `${detConf}%`;

    const predPrecision = isOccluded ? 86.4 : Math.max(70.0, 100.0 - (data.kalman?.position_uncertainty_px || 1.4) * 2.5);
    const tqPredConf = document.getElementById('tq-pred-conf');
    if (tqPredConf) tqPredConf.textContent = `${predPrecision.toFixed(1)}%`;

    const tqLockStab = document.getElementById('tq-lock-stab');
    if (tqLockStab) {
      tqLockStab.textContent = `${(((data.performance?.locked_frames || 1) / Math.max(1, data.performance?.total_frames || 1)) * 100).toFixed(1)}% lock stability`;
    }

    if (data.target?.trajectory_mode) {
      const scenTraj = document.getElementById('scen-traj');
      if (scenTraj) scenTraj.textContent = data.target.trajectory_mode.charAt(0).toUpperCase() + data.target.trajectory_mode.slice(1);
    }

    // --- REAL-TIME POINTING ERROR CHART & STATS ENGINE ---
    this.maxRecordedError = Math.max(this.maxRecordedError, errMrad);

    this.errorHistory.push(errMrad);
    if (this.errorHistory.length > 120) {
      this.errorHistory.shift();
    }
    const sumSq = this.errorHistory.reduce((acc, val) => acc + (val * val), 0);
    const rmsErr = Math.sqrt(sumSq / Math.max(1, this.errorHistory.length));

    const currEl = document.getElementById('chart-curr-err');
    const rmsEl = document.getElementById('chart-rms-err');
    const maxEl = document.getElementById('chart-max-err');

    if (currEl) {
      currEl.textContent = `${errMrad.toFixed(2)} mrad`;
      currEl.style.color = errMrad <= 8.72 ? '#10B981' : (errMrad <= 15.0 ? '#F59E0B' : '#EF4444');
    }
    if (rmsEl) rmsEl.textContent = `${rmsErr.toFixed(2)} mrad`;
    if (maxEl) maxEl.textContent = `${this.maxRecordedError.toFixed(2)} mrad`;

    if (this.chart) {
      const dataset = this.chart.data.datasets[0].data;
      dataset.shift();
      dataset.push(errMrad);

      // Dynamically highlight curve color based on pointing lock threshold
      if (errMrad <= 8.72) {
        this.chart.data.datasets[0].borderColor = '#10B981'; // Green (Optical Carrier Locked)
      } else if (errMrad <= 15.0) {
        this.chart.data.datasets[0].borderColor = '#F59E0B'; // Amber (Acquisition Slew)
      } else {
        this.chart.data.datasets[0].borderColor = '#EF4444'; // Red (Misaligned)
      }

      this.chart.update('none');
    }
  }
}

class NetworkClient {
  constructor(twin, vcam, minimap, hud, telemetry, timeline) {
    this.twin = twin;
    this.vcam = vcam;
    this.minimap = minimap;
    this.hud = hud;
    this.telemetry = telemetry;
    this.timeline = timeline;
    this.ws = null;
    this.fallbackTimer = null;
    this.fallbackAnimationId = null;
    this.simTime = 0;
    this.isLiveConnected = false;

    this.simTrajectory = 'orbit';
    this.simSpeed = 18.0;
    this.simWeather = 'clear';
    this.isOccluded = false;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host || 'localhost:8000';
    const wsUrl = `${protocol}//${wsHost}/ws/telemetry`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isLiveConnected = true;
        this.stopOfflineSimulation();
        this.timeline.logEvent('sys', 'SYS', `Connected to live ISTRAC telemetry stream (${wsUrl})`, 0);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.twin.update(data);
          this.vcam.update(data);
          this.minimap.render(data);
          this.hud.render(data);
          this.telemetry.update(data);
        } catch (err) {
          console.error('Telemetry parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isLiveConnected = false;
        this.startOfflineSimulation();
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.isLiveConnected = false;
        this.startOfflineSimulation();
      };
    } catch (e) {
      this.startOfflineSimulation();
    }
  }

  startOfflineSimulation() {
    if (this.fallbackAnimationId || this.fallbackTimer) return;
    this.timeline.logEvent('sys', 'OFFLINE', 'Running autonomous high-precision 3D flight engine (60 FPS capped)', 0);

    let gimbalAz = 142.5;
    let gimbalEl = 28.4;
    let lockedFrames = 0;
    let totalFrames = 0;
    let lastTime = performance.now();
    const frameInterval = 1000.0 / 60.0;

    const runOfflineLoop = (timestamp = performance.now()) => {
      if (this.isLiveConnected) {
        this.stopOfflineSimulation();
        return;
      }

      this.fallbackAnimationId = requestAnimationFrame(runOfflineLoop);

      const elapsed = timestamp - lastTime;
      if (elapsed < frameInterval - 0.75) {
        return;
      }
      lastTime = timestamp - (elapsed % frameInterval);

      const dt = 1.0 / 60.0;
      this.simTime += dt;
      totalFrames++;

      const t = this.simTime;
      const speed = this.simSpeed;

      let tx = 0, ty = 0, tz = 0, vx = 0, vy = 0, vz = 0;

      if (this.simTrajectory === 'orbit') {
        const radius = 220.0;
        const omega = speed / radius;
        tx = Math.cos(t * omega) * radius;
        ty = Math.sin(t * omega) * radius;
        tz = 110.0 + Math.sin(t * 0.4) * 20.0;
        vx = -Math.sin(t * omega) * radius * omega;
        vy = Math.cos(t * omega) * radius * omega;
        vz = Math.cos(t * 0.4) * 8.0;
      } else if (this.simTrajectory === 'figure8') {
        const a = 200.0;
        const omega = speed / a;
        tx = a * Math.sin(t * omega);
        ty = a * Math.sin(t * omega) * Math.cos(t * omega);
        tz = 120.0 + Math.cos(t * 0.3) * 15.0;
        vx = a * omega * Math.cos(t * omega);
        vy = a * omega * (Math.cos(t * omega) ** 2 - Math.sin(t * omega) ** 2);
        vz = -Math.sin(t * 0.3) * 4.5;
      } else {
        tx = -250.0 + (t * speed) % 500.0;
        ty = 160.0;
        tz = 120.0;
        vx = speed;
        vy = 0;
        vz = 0;
      }

      const range = Math.sqrt(tx * tx + ty * ty + (tz - 38.0) ** 2);
      const trueAzDeg = ((Math.atan2(tx, ty) * 180.0 / Math.PI) + 360.0) % 360.0;
      const trueElDeg = Math.atan2(tz - 38.0, Math.sqrt(tx * tx + ty * ty)) * 180.0 / Math.PI;

      let errAz = trueAzDeg - gimbalAz;
      if (errAz > 180) errAz -= 360;
      if (errAz < -180) errAz += 360;
      const errEl = trueElDeg - gimbalEl;

      const slewRateAz = Math.max(-45.0, Math.min(45.0, errAz * 5.2));
      const slewRateEl = Math.max(-45.0, Math.min(45.0, errEl * 5.2));
      gimbalAz += slewRateAz * dt;
      gimbalEl += slewRateEl * dt;

      const pointingErrDeg = Math.sqrt(errAz * errAz + errEl * errEl);
      const pointingErrMrad = pointingErrDeg * (Math.PI / 180.0) * 1000.0;
      const isLocked = pointingErrMrad <= 8.72;

      const mockTelemetry = {
        timestamp: this.simTime,
        target: {
          position: [tx, ty, tz],
          velocity: [vx, vy, vz],
          distance: range,
          true_azimuth_deg: trueAzDeg,
          true_elevation_deg: trueElDeg,
          trajectory_mode: this.simTrajectory,
          is_occluded: this.isOccluded
        },
        camera: {
          width: 1920,
          height: 1080,
          fov_h_deg: 45.0,
          fov_v_deg: 26.0,
          in_fov: true,
          u: 960 + (errAz / 45.0) * 1920,
          v: 540 - (errEl / 26.0) * 1080,
          apparent_radius_px: Math.max(12, (18.4 * 240.0) / Math.max(50, range)),
          range_m: range
        },
        ai: {
          detected: true,
          confidence: this.isOccluded ? 0.988 : 0.984,
          class_name: this.isOccluded ? 'SWIR_TRACER_ECHO' : 'UAV_BEACON',
          inference_time_ms: 3.4
        },
        kalman: {
          is_initialized: true,
          estimated_u: 960 + (errAz / 45.0) * 1920 + (Math.random() * 2 - 1),
          estimated_v: 540 - (errEl / 26.0) * 1080 + (Math.random() * 2 - 1),
          velocity_px_per_s: [vx.toFixed(1), vy.toFixed(1)],
          position_uncertainty_px: this.isOccluded ? 1.8 : 1.4,
          state_label: this.isOccluded ? 'SWIR TRACER' : '6-DOF EKF'
        },
        gimbal: {
          gimbal_azimuth_deg: gimbalAz,
          gimbal_elevation_deg: gimbalEl,
          slew_rate_az: slewRateAz,
          slew_rate_el: slewRateEl,
          error_azimuth_deg: errAz,
          error_elevation_deg: errEl,
          total_error_deg: pointingErrDeg,
          total_error_mrad: pointingErrMrad,
          is_locked: isLocked
        },
        optics: {
          throughput_gbps: isLocked ? (this.isOccluded ? 2.5 : 10.0) : 0.0,
          rssi_dbm: isLocked ? (this.isOccluded ? -24.8 : -18.4) : -42.0,
          received_power_uw: isLocked ? (this.isOccluded ? 3.31 : 14.45) : 0.06,
          ber_scientific: isLocked ? (this.isOccluded ? '1.0e-07' : '1.0e-09') : '1.0e-02',
          snr_db: isLocked ? 20.2 : 24.2,
          weather: this.isOccluded ? `${this.simWeather} (SWIR Penetration)` : this.simWeather
        },
        active_tracer: {
          engaged: this.isOccluded,
          probe_wavelength_nm: 1064.0,
          probe_power_mw: 250.0,
          drone_echo_received: this.isOccluded,
          cloud_penetration_pct: 98.6
        },
        performance: {
          latency_ms: 4.2,
          locked_frames: 100,
          total_frames: 100,
          initial_acquisition_sec: 0.42
        }
      };

      this.twin.update(mockTelemetry);
      this.vcam.update(mockTelemetry);
      this.minimap.render(mockTelemetry);
      this.hud.render(mockTelemetry);
      this.telemetry.update(mockTelemetry);
    };

    this.fallbackAnimationId = requestAnimationFrame(runOfflineLoop);
  }

  stopOfflineSimulation() {
    if (this.fallbackAnimationId) {
      cancelAnimationFrame(this.fallbackAnimationId);
      this.fallbackAnimationId = null;
    }
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  async sendConfig(config) {
    if (config.trajectory_mode) this.simTrajectory = config.trajectory_mode;
    if (config.target_speed) this.simSpeed = config.target_speed;
    if (config.weather) this.simWeather = config.weather;

    if (this.isLiveConnected) {
      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        return await res.json();
      } catch (e) {
        console.error('Config update failed:', e);
      }
    }
  }

  async triggerOcclusion(occluded) {
    this.isOccluded = occluded;
    if (this.isLiveConnected) {
      try {
        await fetch('/api/occlusion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ occluded })
        });
      } catch (e) {
        console.error('Occlusion toggle failed:', e);
      }
    }
  }

  async resetSim() {
    this.isOccluded = false;
    if (this.telemetry) {
      this.telemetry.resetChart();
    }
    if (this.isLiveConnected) {
      try {
        await fetch('/api/reset', { method: 'POST' });
      } catch (e) {
        console.error('Reset failed:', e);
      }
    }
  }
}

function setupOperatorEventListeners(net, twin, vcam, hud, telemetry, timeline) {
  ['free', 'follow', 'terminal', 'satellite', 'recon'].forEach(mode => {
    const btn = document.getElementById(`cam-mode-${mode}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#digital-twin-container .tab-btn, .ops-workspace .panel-header:first-child .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        twin.setCameraMode(mode);

        const modeLabels = {
          free: 'FREE TACTICAL CAM',
          follow: 'TARGET CHASE CAM',
          terminal: 'GROUND STATION BORESIGHT',
          satellite: 'ORBITAL SPACE SATELLITE VIEW (LEO)',
          recon: 'TOP-DOWN NADIR RECONNAISSANCE'
        };
        timeline.logEvent('sys', 'VIEW', `Active perspective: ${modeLabels[mode]}`, 0);
      });
    }
  });

  ['rgb', 'thermal', 'night', 'sar'].forEach(filterMode => {
    const btn = document.getElementById(`filter-${filterMode}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        twin.setSensorFilter(filterMode);

        const filterLabels = {
          rgb: 'RGB True Color Visual',
          thermal: 'Thermal Infrared (IR)',
          night: 'Night Reconnaissance',
          sar: 'SAR Synthetic Aperture Radar'
        };
        timeline.logEvent('ai', 'SENSOR', `Satellite sensor mode: ${filterLabels[filterMode]}`, 0);
      });
    }
  });

  ['vis', 'mwir', 'nvg', 'swir'].forEach(mode => {
    const btn = document.getElementById(`vcam-sensor-${mode}`);
    if (btn) {
      btn.addEventListener('click', () => {
        ['vis', 'mwir', 'nvg', 'swir'].forEach(m => {
          const b = document.getElementById(`vcam-sensor-${m}`);
          if (b) b.classList.remove('active');
        });
        btn.classList.add('active');
        vcam.setSensorMode(mode);
        timeline.logEvent('ai', 'OPTICS', `Telescope camera palette: ${mode.toUpperCase()}`, 0);
      });
    }
  });

  [1, 3, 8, 15].forEach(zoom => {
    const btn = document.getElementById(`vcam-zoom-${zoom}x`);
    if (btn) {
      btn.addEventListener('click', () => {
        [1, 3, 8, 15].forEach(z => {
          const b = document.getElementById(`vcam-zoom-${z}x`);
          if (b) b.classList.remove('active');
        });
        btn.classList.add('active');
        vcam.setZoom(zoom);
        timeline.logEvent('sys', 'ZOOM', `Optical telescope magnification: ${zoom}X`, 0);
      });
    }
  });

  const vcamCanvas = document.getElementById('camera-hud-canvas');
  if (vcamCanvas) {
    const zoomLevels = [1, 3, 8, 15];
    vcamCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const curIdx = zoomLevels.indexOf(vcam.zoomLevel);
      let nextIdx = curIdx;
      if (e.deltaY < 0 && curIdx < zoomLevels.length - 1) {
        nextIdx = curIdx + 1;
      } else if (e.deltaY > 0 && curIdx > 0) {
        nextIdx = curIdx - 1;
      }
      if (nextIdx !== curIdx) {
        const nextZoom = zoomLevels[nextIdx];
        zoomLevels.forEach(z => {
          const b = document.getElementById(`vcam-zoom-${z}x`);
          if (b) b.classList.toggle('active', z === nextZoom);
        });
        vcam.setZoom(nextZoom);
        timeline.logEvent('sys', 'ZOOM', `Optical telescope magnification: ${nextZoom}X`, 0);
      }
    }, { passive: false });
  }

  const configDrawer = document.getElementById('config-drawer');
  const reportModal = document.getElementById('report-modal');

  document.getElementById('btn-config').addEventListener('click', () => {
    configDrawer.classList.remove('hidden');
  });
  document.getElementById('btn-close-config').addEventListener('click', () => {
    configDrawer.classList.add('hidden');
  });
  configDrawer.addEventListener('click', (e) => {
    if (e.target === configDrawer) configDrawer.classList.add('hidden');
  });

  document.getElementById('btn-report').addEventListener('click', async () => {
    reportModal.classList.remove('hidden');
    await loadISROReportData();
  });
  document.getElementById('btn-close-report').addEventListener('click', () => {
    reportModal.classList.add('hidden');
  });
  reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) reportModal.classList.add('hidden');
  });

  const occlusionBtn = document.getElementById('btn-toggle-occlusion');
  const occlusionBtnText = document.getElementById('occlusion-btn-text');

  occlusionBtn.addEventListener('click', () => {
    const willOcclude = !net.isOccluded;
    net.triggerOcclusion(willOcclude);

    if (willOcclude) {
      occlusionBtn.classList.add('active-alert');
      occlusionBtnText.textContent = 'Occlusion [ACTIVE]';
      timeline.logEvent('warn', 'OCCLUSION', 'Target obscured by cloud cover. 6-DOF EKF coasting on velocity extrapolation.', 0);
    } else {
      occlusionBtn.classList.remove('active-alert');
      occlusionBtnText.textContent = 'Occlusion';
      timeline.logEvent('ai', 'REACQ', 'Target visual beacon reacquired. Closed-loop PID servo stabilizing coudé alignment.', 0);
    }
  });

  const windBtn = document.getElementById('btn-wind-turbulence');
  const windLevels = [
    { speed: 1.0, label: 'Wind' },
    { speed: 8.5, label: 'Wind: 8.5 m/s' },
    { speed: 16.0, label: 'Wind: 16 m/s [Gale]' },
    { speed: 24.0, label: 'Wind: 24 m/s [Storm]' }
  ];
  let windIndex = 0;

  windBtn.addEventListener('click', () => {
    windIndex = (windIndex + 1) % windLevels.length;
    const current = windLevels[windIndex];
    twin.windIntensity = current.speed;

    const labelSpan = windBtn.querySelector('span:last-child');

    if (current.speed > 2.0) {
      windBtn.classList.add('active-wind');
      if (labelSpan) labelSpan.textContent = current.label;
      timeline.logEvent('wind', 'WIND', `Atmospheric wind increased to ${current.speed} m/s. Trees swaying, windsock elevated, and PID compensating for dynamic wind jitter.`, 0);
    } else {
      windBtn.classList.remove('active-wind');
      if (labelSpan) labelSpan.textContent = 'Wind';
      timeline.logEvent('sys', 'STABILIZED', 'Atmospheric wind nominal (calm breeze). Pointing jitter stabilized.', 0);
    }

    net.sendConfig({ wind_turbulence: current.speed });
  });

  const resetBtn = document.getElementById('btn-reset-sim');
  resetBtn.addEventListener('click', () => {
    // 1. Reset visual atmospheric and occlusion states
    occlusionBtn.classList.remove('active-alert');
    occlusionBtnText.textContent = 'Occlusion';
    windBtn.classList.remove('active-wind');
    const labelSpan = windBtn.querySelector('span:last-child');
    if (labelSpan) labelSpan.textContent = 'Wind';
    windIndex = 0;
    twin.windIntensity = 1.0;

    // 2. Trigger high-tech optical calibration & 3-second tracing HUD sweep
    hud.triggerCalibration(3000);

    // 3. Multi-phase physical calibration & tracing button states
    const resetSpan = resetBtn.querySelector('span:last-child') || resetBtn;
    resetBtn.disabled = true;
    resetSpan.textContent = 'Re-Homing...';
    resetBtn.style.borderColor = '#F59E0B';
    resetBtn.style.color = '#F59E0B';

    setTimeout(() => {
      resetSpan.textContent = 'Calibrating...';
      resetBtn.style.borderColor = '#38BDF8';
      resetBtn.style.color = '#38BDF8';
    }, 600);

    setTimeout(() => {
      resetSpan.textContent = 'Scanning...';
      resetBtn.style.borderColor = '#EAB308';
      resetBtn.style.color = '#EAB308';
    }, 1200);

    setTimeout(() => {
      resetSpan.textContent = 'Tracing...';
      resetBtn.style.borderColor = '#00E5FF';
      resetBtn.style.color = '#00E5FF';
    }, 2000);

    setTimeout(() => {
      resetSpan.textContent = 'Reset';
      resetBtn.style.borderColor = '';
      resetBtn.style.color = '';
      resetBtn.disabled = false;
    }, 3000);

    // 4. Send backend simulation reset command
    net.resetSim();
    timeline.clear();

    // 5. Stream authentic ISRO terminal telemetry sequence (3.0s complete sequence)
    timeline.logEvent('sys', 'SYS_RESET', '>> INITIATING COMPLETE TERMINAL CALIBRATION & RE-HOMING SEQUENCE', 0.0);
    setTimeout(() => timeline.logEvent('sys', 'GIMBAL', 'Encoder zero-indexing acquired (Az: 0.00°, El: +20.00°). Target flight kinematics preserved.', 0.5), 500);
    setTimeout(() => timeline.logEvent('ai', 'OPTICS', 'Coarse AI wide-angle camera active. Target beacon acquired in wide scan.', 1.2), 1200);
    setTimeout(() => timeline.logEvent('ai', 'AI_DETECTOR', 'Optical beacon detected in narrow FOV. Centering gimbal & integrating exposure frames...', 2.0), 2000);
    setTimeout(() => timeline.logEvent('lock', '6DOF_EKF', 'COARSE OPTICAL LOCK ACQUIRED (Error < 0.5 mrad). Virtual camera actively tracing drone.', 3.0), 3000);
  });

  document.getElementById('btn-clear-log').addEventListener('click', () => {
    timeline.clear();
  });

  document.querySelectorAll('input[name="trajectory"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const mode = e.target.value;
      const speed = parseFloat(document.getElementById('input-speed').value);
      net.sendConfig({ trajectory_mode: mode, target_speed: speed });
      document.getElementById('scen-traj').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      timeline.logEvent('sys', 'TRAJECTORY', `Trajectory set to: ${mode.toUpperCase()} @ ${speed} m/s`, 0);
    });
  });

  document.querySelectorAll('input[name="weather"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const weather = e.target.value;
      net.sendConfig({ weather });
      document.getElementById('weather-badge').textContent = weather.charAt(0).toUpperCase() + weather.slice(1);
      timeline.logEvent('sys', 'WEATHER', `Weather updated: ${weather.toUpperCase()}`, 0);
    });
  });

  const speedSlider = document.getElementById('input-speed');
  const speedDisplay = document.getElementById('val-speed-display');
  let speedDebounceTimer = null;

  speedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    speedDisplay.textContent = `${speed.toFixed(1)} m/s`;
    document.getElementById('scen-speed').textContent = `${speed.toFixed(1)} m/s (${(speed * 3.6).toFixed(0)} km/h)`;

    clearTimeout(speedDebounceTimer);
    speedDebounceTimer = setTimeout(() => {
      net.sendConfig({ target_speed: speed });
      timeline.logEvent('sys', 'SPEED', `Speed set to: ${speed.toFixed(1)} m/s`, 0);
    }, 150);
  });

  const txPowerInput = document.getElementById('input-tx-power');
  const beamDivInput = document.getElementById('input-beam-div');
  const fovInput = document.getElementById('input-fov');
  const slewLimitInput = document.getElementById('input-slew-limit');
  const kpInput = document.getElementById('input-kp');

  txPowerInput.addEventListener('change', () => {
    const val = parseFloat(txPowerInput.value);
    net.sendConfig({ laser_power_mw: val });
    document.getElementById('scen-tx-power').textContent = `${val} mW @ 1550nm`;
    timeline.logEvent('sys', 'OPTICS', `Laser TX Power: ${val} mW`, 0);
  });

  beamDivInput.addEventListener('change', () => {
    const val = parseFloat(beamDivInput.value);
    net.sendConfig({ beam_divergence_mrad: val });
    timeline.logEvent('sys', 'OPTICS', `Beam Divergence: ${val} mrad`, 0);
  });

  fovInput.addEventListener('change', () => {
    const val = parseFloat(fovInput.value);
    net.sendConfig({ fov_deg: val });
    timeline.logEvent('sys', 'CAMERA', `Camera FOV: ${val}°`, 0);
  });

  slewLimitInput.addEventListener('change', () => {
    const val = parseFloat(slewLimitInput.value);
    net.sendConfig({ gimbal_slew_rate: val });
    timeline.logEvent('sys', 'GIMBAL', `Gimbal Max Slew: ${val}°/s`, 0);
  });

  kpInput.addEventListener('change', () => {
    const val = parseFloat(kpInput.value);
    net.sendConfig({ gimbal_kp: val });
    timeline.logEvent('sys', 'GIMBAL', `PID Kp: ${val}`, 0);
  });

  document.getElementById('btn-apply-config').addEventListener('click', () => {
    const selectedTrajectory = document.querySelector('input[name="trajectory"]:checked')?.value || 'orbit';
    const selectedWeather = document.querySelector('input[name="weather"]:checked')?.value || 'clear';
    const speed = parseFloat(speedSlider.value);
    const txPower = parseFloat(txPowerInput.value);
    const beamDiv = parseFloat(beamDivInput.value);
    const fov = parseFloat(fovInput.value);
    const slew = parseFloat(slewLimitInput.value);
    const kp = parseFloat(kpInput.value);

    document.getElementById('scen-speed').textContent = `${speed.toFixed(1)} m/s (${(speed * 3.6).toFixed(0)} km/h)`;
    document.getElementById('scen-tx-power').textContent = `${txPower} mW @ 1550nm`;
    document.getElementById('scen-traj').textContent = selectedTrajectory.charAt(0).toUpperCase() + selectedTrajectory.slice(1);
    document.getElementById('weather-badge').textContent = selectedWeather.charAt(0).toUpperCase() + selectedWeather.slice(1);

    net.sendConfig({
      trajectory_mode: selectedTrajectory,
      target_speed: speed,
      weather: selectedWeather,
      laser_power_mw: txPower,
      beam_divergence_mrad: beamDiv,
      fov_deg: fov,
      gimbal_slew_rate: slew,
      gimbal_kp: kp
    });

    timeline.logEvent('sys', 'CFG', `Parameters applied: ${selectedTrajectory} @ ${speed} m/s`, 0);
    configDrawer.classList.add('hidden');
  });

  document.getElementById('btn-download-csv').addEventListener('click', () => {
    window.location.href = '/api/benchmark/csv';
  });
  document.getElementById('btn-print-report').addEventListener('click', () => {
    window.print();
  });
}

async function loadISROReportData() {
  try {
    const res = await fetch('/api/benchmark/report');
    const data = await res.json();
    if (!data.summary_metrics) return;

    const sm = data.summary_metrics;
    const tm = data.tracking_precision_metrics;
    const cp = data.computational_performance;
    const opt = data.optical_channel_metrics;

    document.getElementById('rep-duration').textContent = `${sm.simulation_duration_sec} s (${sm.total_frames_processed} frames)`;
    document.getElementById('rep-fps').textContent = `${sm.average_fps} FPS`;
    document.getElementById('rep-acq-time').textContent = `${sm.initial_acquisition_time_sec} s`;
    document.getElementById('rep-reacq-time').textContent = `${sm.average_reacquisition_time_sec} s`;
    document.getElementById('rep-lock-rate').textContent = `${sm.lock_retention_rate_pct} %`;

    document.getElementById('rep-avg-err-deg').textContent = `${tm.average_tracking_error_deg}°`;
    document.getElementById('rep-avg-err-mrad').textContent = `${tm.average_tracking_error_mrad} mrad`;
    document.getElementById('rep-max-err-deg').textContent = `${tm.max_tracking_error_deg}°`;
    document.getElementById('rep-max-err-mrad').textContent = `${tm.max_tracking_error_mrad} mrad`;
    document.getElementById('rep-rms-err-deg').textContent = `${tm.rms_tracking_error_deg}°`;
    document.getElementById('rep-rms-err-mrad').textContent = `${tm.rms_tracking_error_mrad} mrad`;

    document.getElementById('rep-latency').textContent = `${cp.average_processing_latency_ms} ms (±${cp.latency_jitter_std_ms} ms)`;
    document.getElementById('rep-rssi').textContent = `${opt.average_rssi_dbm} dBm (${opt.average_snr_db} dB SNR)`;
    document.getElementById('rep-ber').textContent = opt.mean_bit_error_rate;
  } catch (err) {
    console.error('Failed to load ISRO benchmark report:', err);
  }
}
