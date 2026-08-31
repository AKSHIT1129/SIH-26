/**
 * ISRO FSOC Virtual Camera Tracking Telemetry Console
 * Dual-Viewport 3D Architecture:
 * - Section I: 3D Spatial Tracking Geometry (Free Cam & Follow Cam)
 * - Section II: True 1st-Person Optical Virtual Camera & AI Tracker (Live 3D Telescope View)
 * - Dynamic 5-Step Live Tracking Pipeline Bar
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Subsystems
  const twin = new DigitalTwin3D('digital-twin-container');
  const vcam = new VirtualCameraView('virtual-camera-container', twin.scene);
  const minimap = new TacticalMinimap('minimap-canvas');
  const hud = new EOIRTrackingHUD('camera-hud-canvas');
  const timeline = new EngineeringEventFeed('timeline-log-list');
  const telemetry = new TelemetryConsole(timeline);
  const net = new NetworkClient(twin, vcam, minimap, hud, telemetry, timeline);

  net.connect();
  setupOperatorEventListeners(net, twin, vcam, hud, telemetry, timeline);
});


/**
 * ==========================================================================
 * 1. REAL-WORLD SATELLITE SENSOR GROUND TEXTURE GENERATOR
 * ==========================================================================
 */
function generateSatelliteMapTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // Deep Satellite Ocean Water
  const oceanGrad = ctx.createLinearGradient(1300, 0, 2048, 2048);
  oceanGrad.addColorStop(0, '#0B1118');
  oceanGrad.addColorStop(0.5, '#070C12');
  oceanGrad.addColorStop(1, '#030508');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // Coastal Landmass & Terrain (Sriharikota Island Barrier)
  const landGrad = ctx.createLinearGradient(0, 0, 1400, 2048);
  landGrad.addColorStop(0, '#13151A');
  landGrad.addColorStop(0.5, '#171920');
  landGrad.addColorStop(1, '#111317');
  ctx.fillStyle = landGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(1420, 0);
  ctx.bezierCurveTo(1360, 500, 1520, 1200, 1380, 2048);
  ctx.lineTo(0, 2048);
  ctx.closePath();
  ctx.fill();

  // Coastal Sandy Beach Surf & Breaking Waves
  ctx.strokeStyle = '#27384A';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(1420, 0);
  ctx.bezierCurveTo(1360, 500, 1520, 1200, 1380, 2048);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Terrain Foliage & Sand Dune Topography Patches
  for (let i = 0; i < 60; i++) {
    const rx = Math.random() * 1350;
    const ry = Math.random() * 2048;
    const rw = 60 + Math.random() * 140;
    const rh = 40 + Math.random() * 90;
    ctx.fillStyle = i % 2 === 0 ? '#1A1D24' : '#14161C';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heavy Aerospace Runway 09/27
  ctx.fillStyle = '#1C1D24';
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

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px "Cinzel", "Times New Roman"';
  ctx.fillText('09', 240, 1038);
  ctx.fillText('27', 1280, 1038);

  // Launch Aprons & Taxiways
  ctx.fillStyle = '#242630';
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

  // Primary Concrete Hex Pad
  ctx.fillStyle = '#2C2E38';
  ctx.beginPath();
  ctx.arc(1024, 1024, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.arc(1024, 1024, 115, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Perimeter Access Roads
  ctx.strokeStyle = '#323440';
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

  // Coordinate Grids
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 2048; x += 256) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
  }
  for (let y = 0; y < 2048; y += 256) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = 'bold 16px "IBM Plex Mono"';
  ctx.fillText('13°43\'30"N [SDSC RANGE]', 40, 220);
  ctx.fillText('13°43\'00"N [PTM-01 OPTICAL]', 40, 1000);
  ctx.fillText('13°42\'30"N [BAY OF BENGAL]', 40, 1800);
  ctx.fillText('80°13\'00"E', 240, 2020);
  ctx.fillText('80°13\'30"E', 1000, 2020);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}


/**
 * ==========================================================================
 * 2. 3D SPATIAL DIGITAL TWIN (SECTION I: FREE CAM & FOLLOW CAM)
 * ==========================================================================
 */
class DigitalTwin3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth || 600;
    this.height = this.container.clientHeight || 450;
    this.cameraMode = 'free'; // 'free', 'follow', 'terminal'
    this.lastTargetPos = new THREE.Vector3(150, 100, 120);
    this.lastTargetVel = [0, 0, 0];
    this.currentLookTarget = new THREE.Vector3(0, 0, 40);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060709);
    this.scene.fog = new THREE.FogExp2(0x060709, 0.00028);

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 5000);
    this.camera.position.set(0, -350, 220);
    this.camera.up.set(0, 0, 1);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.01;
      this.controls.minDistance = 15;
      this.controls.maxDistance = 1800;
      this.controls.target.set(0, 0, 40);
      this.controls.update();
    }

    this.flightHistory = [];
    this.maxHistoryPoints = 160;

    this.initSkyAndStars();
    this.initLighting();
    this.initSatelliteGround();
    this.initRangeInfrastructure();
    this.initGroundTerminal();
    this.initSpacecraftSatellite();
    this.initOpticalLaser();
    this.initFlightTrail();
    this.initOcclusionClouds();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initSkyAndStars() {
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2800;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = Math.abs(r * Math.cos(phi)) + 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 2.2, transparent: true, opacity: 0.85 });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.9);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 3.4);
    this.sunLight.position.set(320, -320, 480);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1200;
    this.sunLight.shadow.camera.left = -380;
    this.sunLight.shadow.camera.right = 380;
    this.sunLight.shadow.camera.top = 380;
    this.sunLight.shadow.camera.bottom = -380;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x71717A, 1.5);
    rimLight.position.set(-260, 260, 200);
    this.scene.add(rimLight);

    this.terminalLight = new THREE.PointLight(0xFFFFFF, 3.2, 190);
    this.terminalLight.position.set(0, 0, 34);
    this.scene.add(this.terminalLight);

    this.uavLight = new THREE.PointLight(0xFFFFFF, 3.8, 150);
    this.scene.add(this.uavLight);
  }

  initSatelliteGround() {
    const satTexture = generateSatelliteMapTexture();
    const groundGeo = new THREE.PlaneGeometry(1500, 1500, 64, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      map: satTexture,
      roughness: 0.85,
      metalness: 0.15
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    const padGeo = new THREE.CylinderGeometry(46, 50, 3.2, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x22232A, roughness: 0.7, metalness: 0.3 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = Math.PI / 2;
    pad.position.z = 1.6;
    pad.receiveShadow = true;
    this.scene.add(pad);

    [100, 200, 300].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.8, r + 0.8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0xFFFFFF : 0x71717A,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: idx === 1 ? 0.85 : 0.35
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = 0.2;
      this.scene.add(ring);
    });
  }

  initRangeInfrastructure() {
    this.infraGroup = new THREE.Group();

    // ISRO 32-Meter Deep Space Ground Tracking Dish
    const dishPedGeo = new THREE.CylinderGeometry(5, 8, 18, 16);
    const dishPedMat = new THREE.MeshStandardMaterial({ color: 0x27272A, metalness: 0.8 });
    const dishPed = new THREE.Mesh(dishPedGeo, dishPedMat);
    dishPed.position.set(-180, 160, 9);
    dishPed.rotation.x = Math.PI / 2;
    dishPed.castShadow = true;
    this.infraGroup.add(dishPed);

    const dishGeo = new THREE.SphereGeometry(26, 28, 18, 0, Math.PI * 2, 0, Math.PI / 3);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xF4F4F5, metalness: 0.85, roughness: 0.15, side: THREE.DoubleSide });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(-180, 160, 28);
    dish.rotation.x = -Math.PI / 3;
    dish.rotation.y = Math.PI / 6;
    dish.castShadow = true;
    this.infraGroup.add(dish);

    const feedGeo = new THREE.CylinderGeometry(0.8, 0.8, 14, 8);
    const feedMat = new THREE.MeshStandardMaterial({ color: 0x18181B, metalness: 0.9 });
    const feed = new THREE.Mesh(feedGeo, feedMat);
    feed.position.set(-180, 160, 36);
    this.infraGroup.add(feed);

    // ISRO Tracking Radar Radome
    const radomeBaseGeo = new THREE.CylinderGeometry(15, 18, 8, 16);
    const radomeBaseMat = new THREE.MeshStandardMaterial({ color: 0x27272A });
    const radomeBase = new THREE.Mesh(radomeBaseGeo, radomeBaseMat);
    radomeBase.position.set(-190, -140, 4);
    radomeBase.rotation.x = Math.PI / 2;
    radomeBase.castShadow = true;
    this.infraGroup.add(radomeBase);

    const radomeGeo = new THREE.SphereGeometry(19, 28, 22);
    const radomeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.35 });
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(-190, -140, 21);
    radome.castShadow = true;
    this.infraGroup.add(radome);

    const strobeGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const strobe = new THREE.Mesh(strobeGeo, strobeMat);
    strobe.position.set(-190, -140, 41);
    this.infraGroup.add(strobe);

    // Flight Control & Telemetry Operations Center
    const bldgGeo = new THREE.BoxGeometry(64, 96, 24);
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x1E1E24, metalness: 0.5, roughness: 0.5 });
    const bldg = new THREE.Mesh(bldgGeo, bldgMat);
    bldg.position.set(230, 190, 12);
    bldg.castShadow = true;
    bldg.receiveShadow = true;
    this.infraGroup.add(bldg);

    // Launch Umbilical Lightning Towers
    [[-60, -60], [60, -60], [-60, 60], [60, 60]].forEach(([tx, ty]) => {
      const towerGeo = new THREE.CylinderGeometry(1.2, 2.5, 52, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x52525B, metalness: 0.7 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(tx, ty, 26);
      tower.rotation.x = Math.PI / 2;
      tower.castShadow = true;
      this.infraGroup.add(tower);
    });

    this.scene.add(this.infraGroup);
  }

  initGroundTerminal() {
    this.baseGroup = new THREE.Group();

    const anchorGeo = new THREE.CylinderGeometry(18, 22, 12, 16);
    const anchorMat = new THREE.MeshStandardMaterial({ color: 0x27272A, roughness: 0.8, metalness: 0.2 });
    const anchor = new THREE.Mesh(anchorGeo, anchorMat);
    anchor.rotation.x = Math.PI / 2;
    anchor.position.z = 8;
    anchor.castShadow = true;
    anchor.receiveShadow = true;
    this.baseGroup.add(anchor);

    this.panTurret = new THREE.Group();
    this.panTurret.position.z = 14;

    const baseDiskGeo = new THREE.CylinderGeometry(16, 16, 4, 32);
    const baseDiskMat = new THREE.MeshStandardMaterial({ color: 0x3F3F46, metalness: 0.8, roughness: 0.2 });
    const baseDisk = new THREE.Mesh(baseDiskGeo, baseDiskMat);
    baseDisk.rotation.x = Math.PI / 2;
    baseDisk.position.z = 2;
    baseDisk.castShadow = true;
    this.panTurret.add(baseDisk);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x27272A, metalness: 0.7, roughness: 0.3 });
    const leftArmGeo = new THREE.BoxGeometry(4, 8, 20);
    const leftArm = new THREE.Mesh(leftArmGeo, armMat);
    leftArm.position.set(-11, 0, 14);
    leftArm.castShadow = true;
    this.panTurret.add(leftArm);

    const rightArmGeo = new THREE.BoxGeometry(4, 8, 20);
    const rightArm = new THREE.Mesh(rightArmGeo, armMat);
    rightArm.position.set(11, 0, 14);
    rightArm.castShadow = true;
    this.panTurret.add(rightArm);

    this.tiltAssembly = new THREE.Group();
    this.tiltAssembly.position.set(0, 0, 20);

    const barrelGeo = new THREE.CylinderGeometry(8.0, 9.5, 34, 32);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x141417, metalness: 0.85, roughness: 0.15 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.y = 17;
    barrel.castShadow = true;
    this.tiltAssembly.add(barrel);

    const hoodGeo = new THREE.CylinderGeometry(9.6, 9.6, 6, 32, 1, true);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x27272A, metalness: 0.6, roughness: 0.3 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.rotation.x = Math.PI / 2;
    hood.position.y = 34;
    this.tiltAssembly.add(hood);

    const lensGeo = new THREE.CircleGeometry(7.6, 32);
    this.collimatorMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    const lens = new THREE.Mesh(lensGeo, this.collimatorMat);
    lens.position.y = 33.5;
    this.tiltAssembly.add(lens);

    const coCamGeo = new THREE.CylinderGeometry(2.5, 2.5, 18, 16);
    const coCamMat = new THREE.MeshStandardMaterial({ color: 0x3F3F46, metalness: 0.7, roughness: 0.3 });
    const coCam = new THREE.Mesh(coCamGeo, coCamMat);
    coCam.rotation.x = Math.PI / 2;
    coCam.position.set(7.5, 12, 6.0);
    this.tiltAssembly.add(coCam);

    this.panTurret.add(this.tiltAssembly);
    this.baseGroup.add(this.panTurret);
    this.scene.add(this.baseGroup);
  }

  initSpacecraftSatellite() {
    this.uavGroup = new THREE.Group();

    // Gold Kapton Foil MLI Core
    const bodyGeo = new THREE.BoxGeometry(22, 22, 10.0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xEAB308,
      metalness: 0.9,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.uavGroup.add(body);

    // Silicon Solar Array Wings
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1E3A8A,
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
      const busbarMat = new THREE.MeshBasicMaterial({ color: 0xE4E4E7 });
      [-4, 0, 4].forEach(offsetY => {
        const busbar = new THREE.Mesh(busbarGeo, busbarMat);
        busbar.position.y = offsetY;
        panelGroup.add(busbar);
      });

      const yokeGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
      const yokeMat = new THREE.MeshStandardMaterial({ color: 0x3F3F46 });
      const yoke = new THREE.Mesh(yokeGeo, yokeMat);
      yoke.position.set(-side * 18, 0, 0);
      yoke.rotation.z = Math.PI / 2;
      panelGroup.add(yoke);

      this.uavGroup.add(panelGroup);
    });

    // Retroreflector Beacon Pod
    const beaconGeo = new THREE.SphereGeometry(6.5, 24, 24);
    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const beacon = new THREE.Mesh(beaconGeo, this.beaconMat);
    beacon.position.z = -7.5;
    this.uavGroup.add(beacon);

    // High-Gain Telemetry Horn
    const hornGeo = new THREE.ConeGeometry(3.5, 7.0, 16);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xE4E4E7, metalness: 0.9 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(0, 0, 8.5);
    horn.rotation.x = Math.PI;
    this.uavGroup.add(horn);

    // Spinning Rotors
    this.rotors = [];
    const armCoords = [[16, 16], [-16, 16], [16, -16], [-16, -16]];
    armCoords.forEach((pos, idx) => {
      const propGroup = new THREE.Group();
      propGroup.position.set(pos[0], pos[1], 6.0);

      const bladeGeo = new THREE.BoxGeometry(20, 2.4, 0.4);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      propGroup.add(blade);

      const discGeo = new THREE.CircleGeometry(10, 24);
      const discMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
      const disc = new THREE.Mesh(discGeo, discMat);
      propGroup.add(disc);

      this.uavGroup.add(propGroup);
      this.rotors.push(propGroup);

      const ledGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: idx < 2 ? 0xEF4444 : 0x10B981 });
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
      color: 0xFFFFFF,
      linewidth: 4,
      transparent: true,
      opacity: 0.95
    });
    this.laserBeam = new THREE.Line(laserGeo, this.laserMat);
    this.scene.add(this.laserBeam);

    const beamSheathGeo = new THREE.CylinderGeometry(1.4, 3.6, 1, 16, 1, true);
    this.beamSheathMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.beamSheath = new THREE.Mesh(beamSheathGeo, this.beamSheathMat);
    this.scene.add(this.beamSheath);

    const flareGeo = new THREE.SphereGeometry(8.5, 16, 16);
    this.flareMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
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
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.85,
      linewidth: 3
    });
    this.trailLine = new THREE.Line(this.trailGeo, this.trailMat);
    this.scene.add(this.trailLine);
  }

  initOcclusionClouds() {
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x3F3F46,
      transparent: true,
      opacity: 0.6,
      roughness: 0.95
    });

    const createCloudCluster = (x, y, z, scale) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, y, z);
      const offsets = [
        [0, 0, 0, 32],
        [-20, 10, -5, 24],
        [22, -10, 5, 26],
        [10, 20, 8, 20],
        [-15, -15, 2, 22]
      ];
      offsets.forEach(([ox, oy, oz, r]) => {
        const sphereGeo = new THREE.SphereGeometry(r * scale, 12, 10);
        const mesh = new THREE.Mesh(sphereGeo, cloudMat);
        mesh.position.set(ox * scale, oy * scale, oz * scale);
        cluster.add(mesh);
      });
      return cluster;
    };

    this.cloudsGroup.add(createCloudCluster(120, 150, 120, 1.1));
    this.cloudsGroup.add(createCloudCluster(-110, 90, 105, 1.0));
    this.scene.add(this.cloudsGroup);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'free') {
      if (this.controls) {
        this.controls.enabled = true;
        this.controls.target.set(0, 0, 40);
        this.controls.update();
      }
    } else if (mode === 'follow') {
      if (this.controls) {
        this.controls.enabled = false;
      }
    } else if (mode === 'terminal') {
      if (this.controls) {
        this.controls.enabled = false;
      }
      this.camera.position.set(0, 0, 34);
    }
  }

  update(telemetry) {
    if (!telemetry || !telemetry.target) return;

    const pos = telemetry.target.position;
    const vel = telemetry.target.velocity || [0, 0, 0];
    this.lastTargetPos.set(pos[0], pos[1], pos[2]);
    this.lastTargetVel = vel;
    this.uavGroup.position.set(pos[0], pos[1], pos[2]);
    this.uavLight.position.set(pos[0], pos[1], pos[2]);

    const heading = Math.atan2(vel[1], vel[0]);
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
    }

    const startPt = new THREE.Vector3(0, 0, 34);
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

    let activeColor = 0xFFFFFF;
    let activeHex = '#FFFFFF';

    if (isOccluded) {
      activeColor = 0xEF4444;
      activeHex = '#EF4444';
      this.laserMat.opacity = 0.2;
      this.beamSheathMat.opacity = 0.1;
      this.terminalLight.intensity = 1.0;
    } else if (isLocked) {
      activeColor = 0xFFFFFF;
      activeHex = '#FFFFFF';
      this.laserMat.opacity = 0.95;
      this.beamSheathMat.opacity = 0.55;
      this.terminalLight.intensity = 4.0;
    } else if (totalErrorDeg <= 2.5) {
      activeColor = 0xFFFFFF;
      activeHex = '#FFFFFF';
      this.laserMat.opacity = 0.75;
      this.beamSheathMat.opacity = 0.35;
    } else {
      activeColor = 0xEF4444;
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
      losTag.textContent = 'BLOCKED';
      losTag.className = 'tag-alert font-bold';
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

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.cameraMode === 'free') {
      if (this.controls) this.controls.update();
    } else if (this.cameraMode === 'follow') {
      // Ultra-smooth follow camera behind the moving spacecraft / drone
      const heading = Math.atan2(this.lastTargetVel[1], this.lastTargetVel[0]);
      const dist = 80;
      const height = 35;
      const desiredPos = new THREE.Vector3(
        this.lastTargetPos.x - Math.cos(heading) * dist,
        this.lastTargetPos.y - Math.sin(heading) * dist,
        this.lastTargetPos.z + height
      );
      this.camera.position.lerp(desiredPos, 0.08);
      this.currentLookTarget.lerp(this.lastTargetPos, 0.1);
      this.camera.lookAt(this.currentLookTarget);
    } else if (this.cameraMode === 'terminal') {
      this.camera.position.set(0, 0, 34);
      this.currentLookTarget.lerp(this.lastTargetPos, 0.1);
      this.camera.lookAt(this.currentLookTarget);
    }

    this.renderer.render(this.scene, this.camera);
  }
}


/**
 * ==========================================================================
 * 3. TRUE 1ST-PERSON OPTICAL VIRTUAL CAMERA (SECTION II)
 * ==========================================================================
 */
class VirtualCameraView {
  constructor(containerId, scene) {
    this.container = document.getElementById(containerId);
    this.scene = scene;
    this.width = this.container.clientWidth || 600;
    this.height = this.container.clientHeight || 450;

    this.camera = new THREE.PerspectiveCamera(45.0, this.width / this.height, 0.5, 4500);
    this.camera.position.set(0, 0, 34);
    this.camera.up.set(0, 0, 1);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  update(telemetry) {
    if (!telemetry) return;

    if (telemetry.camera?.fov_h_deg) {
      if (this.camera.fov !== telemetry.camera.fov_h_deg) {
        this.camera.fov = telemetry.camera.fov_h_deg;
        this.camera.updateProjectionMatrix();
      }
    }

    if (telemetry.gimbal) {
      const azRad = THREE.MathUtils.degToRad(telemetry.gimbal.gimbal_azimuth_deg);
      const elRad = THREE.MathUtils.degToRad(telemetry.gimbal.gimbal_elevation_deg);

      const dirX = Math.sin(azRad) * Math.cos(elRad);
      const dirY = Math.cos(azRad) * Math.cos(elRad);
      const dirZ = Math.sin(elRad);

      this.camera.position.set(0, 0, 34);
      this.camera.up.set(0, 0, 1);
      this.camera.lookAt(dirX * 1000, dirY * 1000, 34 + dirZ * 1000);
    }
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}


/**
 * ==========================================================================
 * 4. TACTICAL MINIMAP 2D RADAR (GOOGLE SATELLITE MAP STYLING)
 * ==========================================================================
 */
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
    ctx.strokeStyle = isLocked ? '#FFFFFF' : '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const lat = (13.7199 + pos[1] * 0.000009).toFixed(4);
    const lon = (80.2305 + pos[0] * 0.000009).toFixed(4);
    const gpsEl = document.getElementById('gps-latlong');
    if (gpsEl) gpsEl.textContent = `${lat}°N ${lon}°E`;

    document.getElementById('mm-range').textContent = `${telemetry.target.distance.toFixed(0)}m`;
    document.getElementById('mm-bearing').textContent = `${telemetry.target.true_azimuth_deg.toFixed(0)}°`;
    const mmAlt = document.getElementById('mm-alt');
    if (mmAlt) mmAlt.textContent = `${pos[2].toFixed(0)}m`;
  }
}


/**
 * ==========================================================================
 * 5. EO/IR OPTICAL & AI TRACKING HUD (OVERLAY ON LIVE VIRTUAL CAMERA)
 * ==========================================================================
 */
class EOIRTrackingHUD {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this.manualTarget = null;

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.w / rect.width;
      const scaleY = this.h / rect.height;
      const clickU = (e.clientX - rect.left) * scaleX;
      const clickV = (e.clientY - rect.top) * scaleY;
      this.manualTarget = { u: clickU, v: clickV, time: performance.now() };
    });
  }

  render(telemetry) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Night-Vision Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }

    // Outer Reticle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    // Center Crosshairs
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy); ctx.lineTo(cx - 12, cy);
    ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 70, cy);
    ctx.moveTo(cx, cy - 70); ctx.lineTo(cx - 12);
    ctx.moveTo(cx, cy + 12); ctx.lineTo(cx + 70);
    ctx.stroke();

    // 8.72 mrad Lock Box
    const fov = telemetry?.camera?.fov_h_deg || 45.0;
    const lockBoxPx = (0.50 / fov) * w;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 1.8;
    ctx.strokeRect(cx - lockBoxPx, cy - lockBoxPx, lockBoxPx * 2, lockBoxPx * 2);
    ctx.setLineDash([]);

    // Manual Designation Click Flash
    if (this.manualTarget && (performance.now() - this.manualTarget.time < 1200)) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(this.manualTarget.u, this.manualTarget.v, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Cinzel", "Times New Roman"';
      ctx.fillText('MANUAL DESIGNATION LOCK', this.manualTarget.u + 35, this.manualTarget.v + 5);
    }

    if (!telemetry) return;

    const cam = telemetry.camera;
    const ai = telemetry.ai;
    const kf = telemetry.kalman;
    const isOccluded = telemetry.target?.is_occluded;

    // 1. EKF Predicted Trajectory
    if (kf?.future_trajectory && kf.future_trajectory.length > 0) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      kf.future_trajectory.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.u, pt.v);
        else ctx.lineTo(pt.u, pt.v);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      kf.future_trajectory.forEach((pt, idx) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Cinzel", "Times New Roman"';
        ctx.fillText(`+${idx + 1}`, pt.u + 10, pt.v + 4);
      });
    }

    // 2. YOLOv8 AI Target Detection Bounding Box
    if (ai?.detected && ai.bbox) {
      const [bx, by, bw, bh] = ai.bbox;
      const targetU = cam.u;
      const targetV = cam.v;

      const beaconGlow = ctx.createRadialGradient(targetU, targetV, 2, targetU, targetV, 28);
      beaconGlow.addColorStop(0, '#FFFFFF');
      beaconGlow.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
      beaconGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beaconGlow;
      ctx.beginPath();
      ctx.arc(targetU, targetV, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(bx, by, bw, bh);

      const cornerLen = Math.min(14, bw / 3);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw); ctx.lineTo(bx + bw, by + cornerLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen); ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(targetU - 10, targetV); ctx.lineTo(targetU + 10, targetV);
      ctx.moveTo(targetU, targetV - 10); ctx.lineTo(targetU + 10);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px "Cinzel", "Times New Roman"';
      ctx.fillText(`BEACON ${(ai.confidence * 100).toFixed(1)}%`, bx, by - 10);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(targetU, targetV);
      ctx.stroke();
    } else if (isOccluded) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 18px "IBM Plex Sans"';
      ctx.textAlign = 'center';
      ctx.fillText('TARGET OCCLUSION DETECTED — EKF PREDICTION HORIZON ACTIVE', cx, cy - 35);
      ctx.font = 'bold 14px "Cinzel", "Times New Roman"';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Optical sensor blocked by cloud | Horizon: 1.4s', cx, cy - 10);
      ctx.textAlign = 'start';
    }
  }
}


/**
 * ==========================================================================
 * 6. ENGINEERING EVENT FEED
 * ==========================================================================
 */
class EngineeringEventFeed {
  constructor(listContainerId) {
    this.list = document.getElementById(listContainerId);
  }

  logEvent(type, tag, desc, simTimeSec) {
    const mins = Math.floor(simTimeSec / 60);
    const secs = (simTimeSec % 60).toFixed(2);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;

    const entry = document.createElement('div');
    entry.className = `timeline-entry entry-${type}`;
    entry.innerHTML = `
      <span class="time-stamp">${timeStr}</span>
      <span class="status-badge ${type === 'lock' ? 'badge-lock' : (type === 'warn' ? 'badge-alert' : (type === 'wind' ? 'badge-acq' : 'badge-neutral'))}">${tag}</span>
      <span class="event-desc">${desc}</span>
    `;

    this.list.insertBefore(entry, this.list.firstChild);

    if (this.list.children.length > 40) {
      this.list.removeChild(this.list.lastChild);
    }
  }

  clear() {
    this.list.innerHTML = '';
  }
}


/**
 * ==========================================================================
 * 7. TELEMETRY CONSOLE & CHART.JS PLOTTER
 * ==========================================================================
 */
class TelemetryConsole {
  constructor(timeline) {
    this.timeline = timeline;
    this.initChart();
    this.lastTrackState = null;
    this.maxRecordedError = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.currentFps = 60.0;
  }

  initChart() {
    const ctx = document.getElementById('error-chart').getContext('2d');
    this.chartData = {
      labels: Array(40).fill(''),
      datasets: [
        {
          label: 'Error (mrad)',
          data: Array(40).fill(0),
          borderColor: '#FFFFFF',
          borderWidth: 2.0,
          pointRadius: 0,
          tension: 0.1
        },
        {
          label: 'Limit (8.72 mrad)',
          data: Array(40).fill(8.72),
          borderColor: '#EF4444',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0
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
        scales: {
          x: { display: false },
          y: {
            min: 0,
            max: 20,
            grid: { color: '#27272A' },
            ticks: { color: '#FFFFFF', font: { size: 10, family: 'Cinzel, Times New Roman, serif', weight: 'bold' } }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  update(data) {
    if (!data) return;

    // 1. Sim Time & True FPS
    const simTime = data.timestamp || 0;
    const mins = Math.floor(simTime / 60);
    const secs = (simTime % 60).toFixed(2);
    document.getElementById('nav-sim-time').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;

    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFrameTime >= 1000) {
      this.currentFps = (this.frameCount * 1000) / (now - this.lastFrameTime);
      this.frameCount = 0;
      this.lastFrameTime = now;
      document.getElementById('nav-fps').textContent = this.currentFps.toFixed(1);
    }

    const isLocked = data.gimbal?.is_locked;
    const isOccluded = data.target?.is_occluded;
    const errMrad = data.gimbal?.total_error_mrad || 0;
    const errDeg = data.gimbal?.total_error_deg || 0;

    // 2. Dynamic 5-Step Live Tracking Pipeline
    const p1 = document.getElementById('pipe-step-1');
    const p2 = document.getElementById('pipe-step-2');
    const p3 = document.getElementById('pipe-step-3');
    const p4 = document.getElementById('pipe-step-4');
    const p5 = document.getElementById('pipe-step-5');

    if (p1) p1.className = 'pipeline-step step-active';
    if (p2) p2.className = `pipeline-step ${data.ai?.detected ? 'step-active' : ''}`;
    if (p3) p3.className = `pipeline-step ${data.kalman?.is_initialized ? 'step-active' : ''}`;
    if (p4) p4.className = `pipeline-step ${Math.abs(data.gimbal?.slew_rate_az || 0) > 0.1 ? 'step-active' : ''}`;
    if (p5) p5.className = `pipeline-step ${isLocked ? 'step-active' : ''}`;

    // 3. Tracking State Machine
    let currentState = 'SEARCH';
    let stateClass = 'badge-neutral';
    let stateText = 'SEARCH';
    let stateSub = 'Awaiting target detection';

    if (isOccluded) {
      currentState = 'OCCLUDED';
      stateClass = 'badge-alert';
      stateText = 'OCCLUDED';
      stateSub = 'EKF prediction active (1.4s)';
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
    stateBadge.className = `status-badge ${stateClass}`;
    stateTextEl.textContent = stateText;
    stateSubEl.textContent = stateSub;

    // Log State Transitions
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

    // 4. Hero Pointing Error Readout
    document.getElementById('kpi-pointing-error').textContent = errMrad.toFixed(2);
    document.getElementById('kpi-pointing-deg').textContent = `(${errDeg.toFixed(3)}°)`;

    const kpiLockBadge = document.getElementById('kpi-lock-status');
    const kpiMargin = document.getElementById('kpi-margin-text');
    const marginMrad = 8.72 - errMrad;

    if (isLocked) {
      kpiLockBadge.className = 'status-badge badge-lock';
      kpiLockBadge.textContent = 'LOCK';
      kpiMargin.textContent = `Margin: +${marginMrad.toFixed(2)} mrad`;
    } else if (errMrad <= 15.0) {
      kpiLockBadge.className = 'status-badge badge-acq';
      kpiLockBadge.textContent = 'ACQUIRE';
      kpiMargin.textContent = `Deficit: ${marginMrad.toFixed(2)} mrad`;
    } else {
      kpiLockBadge.className = 'status-badge badge-alert';
      kpiLockBadge.textContent = 'MISALIGNED';
      kpiMargin.textContent = `Deficit: ${marginMrad.toFixed(2)} mrad`;
    }

    // 5. Header Latency
    document.getElementById('nav-latency').textContent = `${data.performance?.latency_ms || 4.2} ms`;

    // 6. EO/IR HUD Overlay Text
    if (data.camera) {
      document.getElementById('hud-fov-val').textContent = `${data.camera.fov_h_deg.toFixed(1)}°`;
      document.getElementById('hud-range').textContent = `${data.camera.range_m.toFixed(1)} m`;
      document.getElementById('hud-beacon-size').textContent = `${data.camera.apparent_radius_px.toFixed(1)} px`;
    }
    if (data.ai) {
      document.getElementById('hud-confidence').textContent = `${(data.ai.confidence * 100).toFixed(1)}%`;
      document.getElementById('vcam-state-tag').textContent = isOccluded ? 'OCCLUDED' : (data.ai.detected ? 'TRACKING' : 'SEARCHING');
      document.getElementById('vcam-state-tag').className = isOccluded ? 'tag-alert font-bold' : (data.ai.detected ? 'tag-lock font-bold' : 'font-bold');
    }
    if (data.kalman) {
      document.getElementById('hud-ekf-state').textContent = data.kalman.state_label;
      document.getElementById('hud-velocity').textContent = `[${data.kalman.velocity_px_per_s[0]}, ${data.kalman.velocity_px_per_s[1]}] px/s`;
      document.getElementById('hud-sigma').textContent = `±${data.kalman.position_uncertainty_px} px`;
    }
    if (data.gimbal) {
      document.getElementById('hud-err-az').textContent = `${data.gimbal.error_azimuth_deg > 0 ? '+' : ''}${data.gimbal.error_azimuth_deg.toFixed(3)}°`;
      document.getElementById('hud-err-el').textContent = `${data.gimbal.error_elevation_deg > 0 ? '+' : ''}${data.gimbal.error_elevation_deg.toFixed(3)}°`;
      document.getElementById('hud-err-total').textContent = `${data.gimbal.total_error_mrad.toFixed(2)} mrad`;

      document.getElementById('val-azimuth').textContent = `${data.gimbal.gimbal_azimuth_deg.toFixed(1)}°`;
      document.getElementById('val-elevation').textContent = `${data.gimbal.gimbal_elevation_deg > 0 ? '+' : ''}${data.gimbal.elevation_deg.toFixed(1)}°`;
      document.getElementById('slew-az').textContent = Math.abs(data.gimbal.slew_rate_az).toFixed(1);
      document.getElementById('slew-el').textContent = Math.abs(data.gimbal.slew_rate_el).toFixed(1);
    }

    // 7. Panel 1: Optical Link Column
    if (data.optics) {
      document.getElementById('val-rssi').textContent = `${data.optics.rssi_dbm.toFixed(1)} dBm`;
      document.getElementById('val-power-uw').textContent = data.optics.received_power_uw.toFixed(2);
      document.getElementById('val-ber').textContent = data.optics.ber_scientific;
      document.getElementById('val-snr').textContent = data.optics.snr_db.toFixed(1);
      
      const linkStateTag = document.getElementById('link-state-tag');
      linkStateTag.textContent = `${data.optics.throughput_gbps} Gbps locked`;
      linkStateTag.className = isLocked ? 'tag-lock val-mono' : 'val-mono';

      document.getElementById('weather-badge').textContent = data.optics.weather.charAt(0).toUpperCase() + data.optics.weather.slice(1);
    }

    // 8. Panel 2: AI & Estimator Column
    const detConf = data.ai?.confidence ? (data.ai.confidence * 100).toFixed(1) : '0.0';
    document.getElementById('tq-det-conf').textContent = `${detConf}%`;
    const predPrecision = isOccluded ? 86.4 : Math.max(70.0, 100.0 - (data.kalman?.position_uncertainty_px || 1.4) * 2.5);
    document.getElementById('tq-pred-conf').textContent = `${predPrecision.toFixed(1)}%`;
    document.getElementById('tq-lock-stab').textContent = `${((data.performance?.locked_frames || 1) / Math.max(1, data.performance?.total_frames || 1) * 100).toFixed(1)}% lock stability`;

    // 9. Panel 2: Scenario Column
    if (data.target) {
      document.getElementById('scen-traj').textContent = data.target.trajectory_mode.charAt(0).toUpperCase() + data.target.trajectory_mode.slice(1);
    }

    // 10. Pointing Error Plot
    this.maxRecordedError = Math.max(this.maxRecordedError, errMrad);
    document.getElementById('chart-curr-err').textContent = `${errMrad.toFixed(2)} mrad`;
    document.getElementById('chart-max-err').textContent = `${this.maxRecordedError.toFixed(2)} mrad`;

    const dataset = this.chart.data.datasets[0].data;
    dataset.shift();
    dataset.push(Math.min(20, errMrad));
    this.chart.update();
  }
}


/**
 * ==========================================================================
 * 8. NETWORK CLIENT & WEBSOCKET
 * ==========================================================================
 */
class NetworkClient {
  constructor(twin, vcam, minimap, hud, telemetry, timeline) {
    this.twin = twin;
    this.vcam = vcam;
    this.minimap = minimap;
    this.hud = hud;
    this.telemetry = telemetry;
    this.timeline = timeline;
    this.ws = null;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.timeline.logEvent('sys', 'SYS', 'Connected to ISTRAC telemetry stream (ws://localhost:8000/ws/telemetry)', 0);
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
      setTimeout(() => this.connect(), 2000);
    };
  }

  async sendConfig(config) {
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

  async triggerOcclusion(occluded) {
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

  async resetSim() {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }
}


/**
 * ==========================================================================
 * 9. OPERATOR CONTROLS & SETTINGS
 * ==========================================================================
 */
function setupOperatorEventListeners(net, twin, vcam, hud, telemetry, timeline) {
  // 1. Camera View Tabs (Free Cam, Follow Cam, Ground Station)
  ['free', 'follow', 'terminal'].forEach(mode => {
    const btn = document.getElementById(`cam-mode-${mode}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        twin.setCameraMode(mode);
        timeline.logEvent('sys', 'VIEW', `Active 3D perspective: ${mode === 'free' ? 'FREE CAM' : (mode === 'follow' ? 'FOLLOW CAM' : 'GROUND STATION')}`, 0);
      });
    }
  });

  // 2. Modals
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

  // 3. Action: Trigger Cloud Occlusion (3s)
  document.getElementById('btn-toggle-occlusion').addEventListener('click', () => {
    net.triggerOcclusion(true);
    const btnText = document.getElementById('occlusion-btn-text');
    btnText.textContent = 'Occlusion active...';
    timeline.logEvent('warn', 'OCCLUSION', 'Target obscured by cloud. EKF coasting on velocity extrapolation.', 0);

    setTimeout(() => {
      net.triggerOcclusion(false);
      btnText.textContent = 'Occlusion test';
      timeline.logEvent('ai', 'REACQ', 'Target visual beacon reacquired. Closed-loop PID servo stabilizing.', 0);
    }, 3000);
  });

  // 4. Action: Inject Wind Turbulence
  document.getElementById('btn-wind-turbulence').addEventListener('click', () => {
    timeline.logEvent('wind', 'WIND', 'Wind disturbance injected (4.5 m/s turbulence). Closed-loop PID compensating.', 0);
    net.sendConfig({ wind_turbulence: 4.5 });
    setTimeout(() => {
      net.sendConfig({ wind_turbulence: 0.5 });
      timeline.logEvent('sys', 'STABILIZED', 'Wind turbulence damped to nominal (0.5 m/s).', 0);
    }, 2500);
  });

  // 5. Action: Reset Simulation
  document.getElementById('btn-reset-sim').addEventListener('click', () => {
    timeline.logEvent('sys', 'RESET', 'Simulation scenario, gimbal PID integrators, and EKF filter reset.', 0);
    net.resetSim();
  });

  // 6. Clear Event Feed
  document.getElementById('btn-clear-log').addEventListener('click', () => {
    timeline.clear();
  });

  // 7. Real-Time Reactive Trajectory Radios
  document.querySelectorAll('input[name="trajectory"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const mode = e.target.value;
      const speed = parseFloat(document.getElementById('input-speed').value);
      net.sendConfig({ trajectory_mode: mode, target_speed: speed });
      document.getElementById('scen-traj').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      timeline.logEvent('sys', 'TRAJECTORY', `Flight trajectory changed to: ${mode.toUpperCase()} @ ${speed} m/s`, 0);
    });
  });

  // 8. Real-Time Reactive Weather Radios
  document.querySelectorAll('input[name="weather"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const weather = e.target.value;
      net.sendConfig({ weather });
      document.getElementById('weather-badge').textContent = weather.charAt(0).toUpperCase() + weather.slice(1);
      timeline.logEvent('sys', 'WEATHER', `Atmospheric channel updated: ${weather.toUpperCase()}`, 0);
    });
  });

  // 9. Real-Time Reactive Speed Slider
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
      timeline.logEvent('sys', 'SPEED', `Target velocity set to: ${speed.toFixed(1)} m/s (${(speed * 3.6).toFixed(0)} km/h)`, 0);
    }, 150);
  });

  // 10. Real-Time Input Change Listeners
  const txPowerInput = document.getElementById('input-tx-power');
  const beamDivInput = document.getElementById('input-beam-div');
  const fovInput = document.getElementById('input-fov');
  const slewLimitInput = document.getElementById('input-slew-limit');
  const kpInput = document.getElementById('input-kp');

  txPowerInput.addEventListener('change', () => {
    const val = parseFloat(txPowerInput.value);
    net.sendConfig({ laser_power_mw: val });
    document.getElementById('scen-tx-power').textContent = `${val} mW (${(10 * Math.log10(val)).toFixed(1)} dBm) @ 1550nm`;
    timeline.logEvent('sys', 'OPTICS', `Laser TX Power updated to: ${val} mW`, 0);
  });

  beamDivInput.addEventListener('change', () => {
    const val = parseFloat(beamDivInput.value);
    net.sendConfig({ beam_divergence_mrad: val });
    timeline.logEvent('sys', 'OPTICS', `Beam Divergence updated to: ${val} mrad`, 0);
  });

  fovInput.addEventListener('change', () => {
    const val = parseFloat(fovInput.value);
    net.sendConfig({ fov_deg: val });
    timeline.logEvent('sys', 'CAMERA', `Virtual Camera FOV updated to: ${val}°`, 0);
  });

  slewLimitInput.addEventListener('change', () => {
    const val = parseFloat(slewLimitInput.value);
    net.sendConfig({ gimbal_slew_rate: val });
    timeline.logEvent('sys', 'GIMBAL', `Gimbal Max Slew Limit updated to: ${val}°/s`, 0);
  });

  kpInput.addEventListener('change', () => {
    const val = parseFloat(kpInput.value);
    net.sendConfig({ gimbal_kp: val });
    timeline.logEvent('sys', 'GIMBAL', `PID Kp Gain updated to: ${val}`, 0);
  });

  // 11. Apply All Settings Button
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
    document.getElementById('scen-tx-power').textContent = `${txPower} mW (${(10 * Math.log10(txPower)).toFixed(1)} dBm) @ 1550nm`;
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

    timeline.logEvent('sys', 'CFG', `All parameters applied: ${selectedTrajectory} @ ${speed} m/s | ${txPower}mW | Slew ${slew}°/s`, 0);
    configDrawer.classList.add('hidden');
  });

  // 12. CSV Download & Print Actions
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
