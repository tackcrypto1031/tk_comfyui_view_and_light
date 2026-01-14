import * as THREE from 'three'
import type { CameraState, CameraWidgetOptions } from './types'
import { injectStyles } from './styles'

export class CameraWidget {
  private container: HTMLElement
  private state: CameraState
  private onStateChange?: (state: CameraState) => void

  // Three.js objects
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer

  // Scene objects
  private cameraIndicator!: THREE.Mesh
  private camGlow!: THREE.Mesh
  private azimuthHandle!: THREE.Mesh
  private azGlow!: THREE.Mesh
  private elevationHandle!: THREE.Mesh
  private elGlow!: THREE.Mesh
  private distanceHandle!: THREE.Mesh
  private distGlow!: THREE.Mesh
  private glowRing!: THREE.Mesh
  private imagePlane!: THREE.Mesh
  private imageFrame!: THREE.LineSegments
  private planeMat!: THREE.MeshBasicMaterial
  private distanceTube: THREE.Mesh | null = null

  // Light objects
  private lightIndicator!: THREE.Mesh
  private lightGlow!: THREE.Mesh
  private lightHelpline!: THREE.ArrowHelper

  // Control objects
  private azimuthRing!: THREE.Mesh
  private elevationArc!: THREE.Mesh
  private gridHelper!: THREE.GridHelper

  // Constants
  private readonly CENTER = new THREE.Vector3(0, 0.5, 0)
  private readonly AZIMUTH_RADIUS = 1.8
  private readonly ELEVATION_RADIUS = 1.4
  private readonly ELEV_ARC_X = -0.8

  // Live values
  private liveAzimuth = 0
  private liveElevation = 0
  private liveDistance = 5
  private liveLightAzimuth = 45
  private liveLightElevation = 45

  // Interaction state
  private isDragging = false
  private dragTarget: string | null = null
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private lastNotifyTime = 0

  // Color Picker State
  private colorPickerOverlay: HTMLElement | null = null
  private liveH = 0
  private liveS = 1
  private liveV = 1

  // DOM elements
  private canvasContainer!: HTMLElement
  private promptEl!: HTMLElement
  private tabCamera!: HTMLElement
  private tabLight!: HTMLElement
  private hValueEl!: HTMLElement
  private vValueEl!: HTMLElement
  private zValueEl!: HTMLElement

  // Current mode
  private currentMode: 'camera' | 'light' = 'camera'

  constructor(options: CameraWidgetOptions) {
    injectStyles()

    this.container = options.container
    this.onStateChange = options.onStateChange
    this.state = {
      azimuth: options.initialState?.azimuth ?? 0,
      elevation: options.initialState?.elevation ?? 0,
      distance: options.initialState?.distance ?? 5,
      imageUrl: options.initialState?.imageUrl ?? null,
      enableLight: options.initialState?.enableLight ?? false,
      lightAzimuth: options.initialState?.lightAzimuth ?? 45,
      lightElevation: options.initialState?.lightElevation ?? 45,
      lightColor: options.initialState?.lightColor ?? '#ffffff'
    }

    this.liveAzimuth = this.state.azimuth
    this.liveElevation = this.state.elevation
    this.liveDistance = this.state.distance
    this.liveLightAzimuth = this.state.lightAzimuth
    this.liveLightElevation = this.state.lightElevation
    this.updateHSVFromHex(this.state.lightColor)

    this.createDOM()
    this.initThreeJS()
    this.bindEvents()
    this.updateDisplay()
    this.updateVisuals()
    this.animate()
  }

  private createDOM(): void {
    const isLightEnabled = this.state.enableLight
    this.container.innerHTML = `
      <div class="qwen-multiangle-container">
        <div class="tk-tabs">
            <div class="tk-tab active" data-tab="camera">Camera</div>
            <div class="tk-tab ${isLightEnabled ? '' : 'disabled'}" data-tab="light">Light</div>
        </div>
      
        <div class="qwen-multiangle-canvas"></div>
        <div class="qwen-multiangle-prompt"></div>

        <div class="qwen-multiangle-info">
          <div class="qwen-multiangle-param">
            <div class="qwen-multiangle-param-label">HORIZONTAL</div>
            <div class="qwen-multiangle-param-value azimuth">0°</div>
          </div>
          <div class="qwen-multiangle-param">
            <div class="qwen-multiangle-param-label">VERTICAL</div>
            <div class="qwen-multiangle-param-value elevation">0°</div>
          </div>
    <div class="qwen-multiangle-param" id="param-zoom">
            <div class="qwen-multiangle-param-label">ZOOM</div>
            <div class="qwen-multiangle-param-value zoom">5.0</div>
          </div>
          <div class="qwen-multiangle-param" id="param-light-color" style="display: none; cursor: pointer;">
            <div class="qwen-multiangle-param-label">COLOR</div>
            <div class="qwen-multiangle-param-value light-color-swatch" style="display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span class="color-preview-dot" style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #666;"></span>
              <span class="color-value">#FFFFFF</span>
            </div>
          </div>
          <button class="qwen-multiangle-reset" title="Reset">↺</button>
        </div>
      </div>
    `

    const containerEl = this.container.querySelector('.qwen-multiangle-container') as HTMLElement
    this.canvasContainer = containerEl.querySelector('.qwen-multiangle-canvas') as HTMLElement
    this.promptEl = containerEl.querySelector('.qwen-multiangle-prompt') as HTMLElement
    this.hValueEl = containerEl.querySelector('.qwen-multiangle-param-value.azimuth') as HTMLElement
    this.vValueEl = containerEl.querySelector('.qwen-multiangle-param-value.elevation') as HTMLElement
    this.zValueEl = containerEl.querySelector('.qwen-multiangle-param-value.zoom') as HTMLElement

    this.tabCamera = containerEl.querySelector('.tk-tab[data-tab="camera"]') as HTMLElement
    this.tabLight = containerEl.querySelector('.tk-tab[data-tab="light"]') as HTMLElement

    // Light Color Click
    const lightColorBtn = containerEl.querySelector('#param-light-color') as HTMLElement;
    lightColorBtn?.addEventListener('click', () => this.openColorPicker());

    // Reset
    containerEl.querySelector('.qwen-multiangle-reset')?.addEventListener('click', () => this.resetToDefaults())

    // Tabs
    this.tabCamera.addEventListener('click', () => this.switchMode('camera'));
    this.tabLight.addEventListener('click', () => {
      if (this.state.enableLight) this.switchMode('light');
    });
  }

  private switchMode(mode: 'camera' | 'light'): void {
    if (mode === 'light' && !this.state.enableLight) return;

    this.currentMode = mode;
    this.tabCamera.classList.toggle('active', mode === 'camera');
    this.tabLight.classList.toggle('active', mode === 'light');

    const paramZoom = this.container.querySelector('#param-zoom') as HTMLElement;
    const paramColor = this.container.querySelector('#param-light-color') as HTMLElement;

    if (mode === 'light') {
      this.hValueEl.classList.remove('azimuth'); this.hValueEl.classList.add('light-azimuth');
      this.vValueEl.classList.remove('elevation'); this.vValueEl.classList.add('light-elevation');
      if (paramZoom) paramZoom.style.display = 'none';
      if (paramColor) paramColor.style.display = 'block';
    } else {
      this.hValueEl.classList.add('azimuth'); this.hValueEl.classList.remove('light-azimuth');
      this.vValueEl.classList.add('elevation'); this.vValueEl.classList.remove('light-elevation');
      if (paramZoom) paramZoom.style.display = 'block';
      if (paramColor) paramColor.style.display = 'none';
    }

    this.updateDisplay();
    this.updateVisuals();
  }

  private initThreeJS(): void {
    const width = this.canvasContainer.clientWidth || 300
    const height = this.canvasContainer.clientHeight || 300

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0f)

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    this.camera.position.set(4, 3.5, 4)
    this.camera.lookAt(0, 0.3, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.canvasContainer.appendChild(this.renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    this.gridHelper = new THREE.GridHelper(5, 20, 0x1a1a2e, 0x12121a)
    this.gridHelper.position.y = -0.01
    this.scene.add(this.gridHelper)

    this.createSubject()
    this.createCameraIndicator()
    this.createLightIndicator()
    this.createControls()

    this.updateVisuals()
  }

  private createSubject(): void {
    const cardGeo = new THREE.BoxGeometry(1.2, 1.2, 0.02)
    this.planeMat = new THREE.MeshBasicMaterial({ color: 0x222233 })
    this.imagePlane = new THREE.Mesh(cardGeo, this.planeMat)
    this.imagePlane.position.copy(this.CENTER)
    this.scene.add(this.imagePlane)
    this.imageFrame = new THREE.LineSegments(new THREE.EdgesGeometry(cardGeo), new THREE.LineBasicMaterial({ color: 0xE93D82 }))
    this.imageFrame.position.copy(this.CENTER)
    this.scene.add(this.imageFrame)
    this.glowRing = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.58, 64), new THREE.MeshBasicMaterial({ color: 0xE93D82, transparent: true, opacity: 0.4, side: THREE.DoubleSide }))
    this.glowRing.position.set(0, 0.01, 0); this.glowRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.glowRing)
  }

  private createCameraIndicator(): void {
    const camGeo = new THREE.ConeGeometry(0.15, 0.4, 4)
    const camMat = new THREE.MeshStandardMaterial({ color: 0xE93D82, emissive: 0xE93D82, emissiveIntensity: 0.5 })
    this.cameraIndicator = new THREE.Mesh(camGeo, camMat)
    this.scene.add(this.cameraIndicator)
    this.camGlow = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xff6ba8, transparent: true, opacity: 0.8 }))
    this.scene.add(this.camGlow)
  }

  private createControls(): void {
    this.azimuthRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.04, 16, 100), new THREE.MeshBasicMaterial({ color: 0xE93D82, transparent: true, opacity: 0.7 }))
    this.azimuthRing.rotation.x = Math.PI / 2; this.azimuthRing.position.y = 0.02; this.scene.add(this.azimuthRing)

    this.azimuthHandle = new THREE.Mesh(new THREE.SphereGeometry(0.16), new THREE.MeshStandardMaterial({ color: 0xE93D82, emissive: 0xE93D82, emissiveIntensity: 0.6 }))
    this.scene.add(this.azimuthHandle)
    this.azGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xE93D82, transparent: true, opacity: 0.2 }))
    this.scene.add(this.azGlow)

    const arcPoints = []; for (let i = 0; i <= 32; i++) {
      const ang = (-30 + (90 * i / 32)) * Math.PI / 180;
      arcPoints.push(new THREE.Vector3(-0.8, 1.4 * Math.sin(ang) + 0.5, 1.4 * Math.cos(ang)))
    }
    this.elevationArc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints), 32, 0.04), new THREE.MeshBasicMaterial({ color: 0x00FFD0, transparent: true, opacity: 0.8 }))
    this.scene.add(this.elevationArc)

    this.elevationHandle = new THREE.Mesh(new THREE.SphereGeometry(0.16), new THREE.MeshStandardMaterial({ color: 0x00FFD0, emissive: 0x00FFD0, emissiveIntensity: 0.6 }))
    this.scene.add(this.elevationHandle)
    this.elGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0x00FFD0, transparent: true, opacity: 0.2 }))
    this.scene.add(this.elGlow)

    this.distanceHandle = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshStandardMaterial({ color: 0xFFB800, emissive: 0xFFB800, emissiveIntensity: 0.7 }))
    this.scene.add(this.distanceHandle)
    this.distGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xFFB800, transparent: true, opacity: 0.25 }))
    this.scene.add(this.distGlow)
  }

  private createLightIndicator(): void {
    // Create light bulb shape: sphere (bulb) + small cone (base)
    const bulbGroup = new THREE.Group();

    // Bulb (sphere)
    const bulbGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 0.8 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulbGroup.add(bulb);

    // Base (small cone pointing down)
    const baseGeo = new THREE.ConeGeometry(0.1, 0.15, 8);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.25;
    base.rotation.x = Math.PI;  // Point down
    bulbGroup.add(base);

    this.lightIndicator = bulbGroup as unknown as THREE.Mesh;
    this.scene.add(bulbGroup);

    this.lightGlow = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.3 }));
    this.scene.add(this.lightGlow);
    this.lightHelpline = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
    this.scene.add(this.lightHelpline);
  }

  private updateVisuals(): void {
    const isLight = this.currentMode === 'light';
    const az = isLight ? this.liveLightAzimuth : this.liveAzimuth;
    const el = isLight ? this.liveLightElevation : this.liveElevation;
    const colorHex = isLight ? 0xFFA500 : 0xE93D82;

    const azRad = (az * Math.PI) / 180;
    const elRad = (el * Math.PI) / 180;

    const azX = this.AZIMUTH_RADIUS * Math.sin(azRad);
    const azZ = this.AZIMUTH_RADIUS * Math.cos(azRad);
    this.azimuthHandle.position.set(azX, 0.16, azZ);
    this.azGlow.position.copy(this.azimuthHandle.position);

    const visualEl = Math.max(-30, Math.min(60, el));
    const elY = this.CENTER.y + this.ELEVATION_RADIUS * Math.sin(visualEl * Math.PI / 180);
    const elZ = this.ELEVATION_RADIUS * Math.cos(visualEl * Math.PI / 180);
    this.elevationHandle.position.set(this.ELEV_ARC_X, elY, elZ);
    this.elGlow.position.copy(this.elevationHandle.position);

    (this.azimuthRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.azimuthHandle.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
    (this.azimuthHandle.material as THREE.MeshStandardMaterial).emissive.setHex(colorHex);
    (this.elevationArc.material as THREE.MeshBasicMaterial).color.setHex(isLight ? 0xFFA500 : 0x00FFD0);
    (this.elevationHandle.material as THREE.MeshStandardMaterial).color.setHex(isLight ? 0xFFA500 : 0x00FFD0);
    (this.elevationHandle.material as THREE.MeshStandardMaterial).emissive.setHex(isLight ? 0xFFA500 : 0x00FFD0);

    this.distanceHandle.visible = !isLight;
    this.distGlow.visible = !isLight;
    if (this.distanceTube) this.distanceTube.visible = !isLight;

    // Camera Indicator Position
    const camAzRad = (this.liveAzimuth * Math.PI) / 180;
    const camElRad = (this.liveElevation * Math.PI) / 180;
    const camDist = 2.6 - (this.liveDistance / 10) * 2.0;
    const cx = camDist * Math.sin(camAzRad) * Math.cos(camElRad);
    const cy = 0.5 + camDist * Math.sin(camElRad);
    const cz = camDist * Math.cos(camAzRad) * Math.cos(camElRad);
    this.cameraIndicator.position.set(cx, cy, cz);
    this.cameraIndicator.lookAt(0, 0.5, 0);
    this.cameraIndicator.rotateX(Math.PI / 2);
    this.camGlow.position.copy(this.cameraIndicator.position);

    // Distance Handle + Tube
    if (!isLight) {
      const distT = 0.15 + ((10 - this.liveDistance) / 10) * 0.7;
      this.distanceHandle.position.lerpVectors(this.CENTER, this.cameraIndicator.position, distT);
      this.distGlow.position.copy(this.distanceHandle.position);
      this.updateDistanceTube(this.CENTER.clone(), this.cameraIndicator.position.clone());
    }

    // Light Indicator
    const lAzRad = (this.liveLightAzimuth * Math.PI) / 180;
    const lElRad = (this.liveLightElevation * Math.PI) / 180;
    const lDist = 3.0;
    const lx = lDist * Math.sin(lAzRad) * Math.cos(lElRad);
    const ly = 0.5 + lDist * Math.sin(lElRad);
    const lz = lDist * Math.cos(lAzRad) * Math.cos(lElRad);

    this.lightIndicator.visible = this.state.enableLight;
    this.lightGlow.visible = this.state.enableLight;
    this.lightHelpline.visible = this.state.enableLight;

    if (this.state.enableLight) {
      this.lightIndicator.position.set(lx, ly, lz);
      this.lightIndicator.lookAt(0, 0.5, 0);
      this.lightIndicator.rotateX(-Math.PI / 2);
      this.lightGlow.position.copy(this.lightIndicator.position);

      const dir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0.5, 0), this.lightIndicator.position).normalize();
      this.lightHelpline.setDirection(dir);
      this.lightHelpline.position.copy(this.lightIndicator.position);
      this.lightHelpline.setLength(lDist * 0.8);

      const col = new THREE.Color(this.state.lightColor);
      // Update bulb material color (it's a Group, need to access first child)
      const bulbMesh = this.lightIndicator.children?.[0] as THREE.Mesh;
      if (bulbMesh?.material) {
        (bulbMesh.material as THREE.MeshStandardMaterial).color.set(col);
        (bulbMesh.material as THREE.MeshStandardMaterial).emissive.set(col);
      }
      // Update glow sphere color
      (this.lightGlow.material as THREE.MeshBasicMaterial).color.set(col);
      // Update helpline arrow color
      (this.lightHelpline.line.material as THREE.LineBasicMaterial).color.set(col);
    }
  }

  private updateDistanceTube(start: THREE.Vector3, end: THREE.Vector3) {
    if (this.distanceTube) { this.scene.remove(this.distanceTube); this.distanceTube.geometry.dispose(); }
    this.distanceTube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 1, 0.025), new THREE.MeshBasicMaterial({ color: 0xFFB800, transparent: true, opacity: 0.8 }))
    this.scene.add(this.distanceTube)
  }

  private updateDisplay(): void {
    const isLight = this.currentMode === 'light';
    // Round to 1 decimal place
    const hVal = isLight ? this.liveLightAzimuth : this.liveAzimuth;
    const vVal = isLight ? this.liveLightElevation : this.liveElevation;

    this.hValueEl.textContent = `${Math.round(hVal)}°`;
    this.vValueEl.textContent = `${Math.round(vVal)}°`;
    this.zValueEl.textContent = `${this.liveDistance.toFixed(1)}`;

    // Update Color Swatch
    const swatchDot = this.container.querySelector('.color-preview-dot') as HTMLElement;
    const swatchText = this.container.querySelector('.color-value') as HTMLElement;
    if (swatchDot && swatchText) {
      swatchDot.style.background = this.state.lightColor;
      swatchText.textContent = this.state.lightColor;
    }

    // Prompt Display
    let promptText = `Cam: ${Math.round(this.liveAzimuth)}°/${Math.round(this.liveElevation)}° Z:${this.liveDistance.toFixed(1)}`;
    if (this.state.enableLight) {
      promptText += ` | Light: ${Math.round(this.liveLightAzimuth)}°/${Math.round(this.liveLightElevation)}° ${this.state.lightColor}`;
    }
    this.promptEl.textContent = promptText;
  }

  private onPointerDown(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const handles = [
      { mesh: this.azimuthHandle, name: 'azimuth' },
      { mesh: this.elevationHandle, name: 'elevation' },
      { mesh: this.distanceHandle, name: 'distance' }
    ];
    for (const h of handles) {
      if (!h.mesh.visible) continue;
      if (this.raycaster.intersectObject(h.mesh).length > 0) {
        this.isDragging = true;
        this.dragTarget = h.name;
        this.renderer.domElement.style.cursor = 'grabbing';
        return;
      }
    }
  }

  private onPointerMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const now = Date.now();
    const shouldNotify = now - this.lastNotifyTime > 80;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const isLight = this.currentMode === 'light';

    const plane = new THREE.Plane();
    const intersect = new THREE.Vector3();

    if (this.dragTarget === 'azimuth') {
      plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
      if (this.raycaster.ray.intersectPlane(plane, intersect)) {
        let angle = Math.atan2(intersect.x, intersect.z) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        if (isLight) { this.liveLightAzimuth = Math.round(angle); this.state.lightAzimuth = this.liveLightAzimuth; }
        else { this.liveAzimuth = Math.round(angle); this.state.azimuth = this.liveAzimuth; }
      }
    } else if (this.dragTarget === 'elevation') {
      const elevPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), - (-0.8));
      if (this.raycaster.ray.intersectPlane(elevPlane, intersect)) {
        const relY = intersect.y - 0.5; const relZ = intersect.z;
        let angle = Math.atan2(relY, relZ) * (180 / Math.PI);
        if (isLight) {
          angle = Math.max(-90, Math.min(90, angle));
          this.liveLightElevation = Math.round(angle);
          this.state.lightElevation = this.liveLightElevation;
        } else {
          angle = Math.max(-30, Math.min(60, angle));
          this.liveElevation = Math.round(angle);
          this.state.elevation = this.liveElevation;
        }
      }
    } else if (this.dragTarget === 'distance') {
      const newDist = Math.max(0, Math.min(10, 5 - this.mouse.y * 5));
      this.liveDistance = Math.round(newDist * 10) / 10;
      this.state.distance = this.liveDistance;
    }

    this.updateDisplay();
    this.updateVisuals();

    if (shouldNotify) {
      this.notifyStateChange();
      this.lastNotifyTime = now;
    }
  }

  private onPointerUp() {
    this.isDragging = false;
    this.dragTarget = null;
    this.renderer.domElement.style.cursor = 'default';
    this.notifyStateChange();
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement
    canvas.addEventListener('mousedown', this.onPointerDown.bind(this))
    canvas.addEventListener('mousemove', this.onPointerMove.bind(this))
    canvas.addEventListener('mouseup', this.onPointerUp.bind(this))
    canvas.addEventListener('mouseleave', this.onPointerUp.bind(this))
    new ResizeObserver(() => {
      const w = this.canvasContainer.clientWidth; const h = this.canvasContainer.clientHeight;
      if (w && h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); }
    }).observe(this.canvasContainer);
  }

  private notifyStateChange() { if (this.onStateChange) this.onStateChange(this.state); }
  private animate() { requestAnimationFrame(() => this.animate()); this.renderer.render(this.scene, this.camera); }

  public setState(newState: Partial<CameraState>) {
    if (this.isDragging) return;

    // If camera values changed while in light mode, switch back to camera mode
    const cameraChanged = (newState.azimuth !== undefined && newState.azimuth !== this.state.azimuth) ||
      (newState.elevation !== undefined && newState.elevation !== this.state.elevation) ||
      (newState.distance !== undefined && newState.distance !== this.state.distance);

    // Update state
    if (newState.azimuth !== undefined) { this.state.azimuth = newState.azimuth; this.liveAzimuth = newState.azimuth; }
    if (newState.elevation !== undefined) { this.state.elevation = newState.elevation; this.liveElevation = newState.elevation; }
    if (newState.distance !== undefined) { this.state.distance = newState.distance; this.liveDistance = newState.distance; }
    if (newState.lightAzimuth !== undefined) { this.state.lightAzimuth = newState.lightAzimuth; this.liveLightAzimuth = newState.lightAzimuth; }
    if (newState.lightElevation !== undefined) { this.state.lightElevation = newState.lightElevation; this.liveLightElevation = newState.lightElevation; }
    if (newState.lightColor !== undefined) { this.state.lightColor = newState.lightColor; this.updateHSVFromHex(newState.lightColor); }
    if (newState.enableLight !== undefined) {
      this.state.enableLight = newState.enableLight;
      this.tabLight.classList.toggle('disabled', !newState.enableLight);
      if (!newState.enableLight && this.currentMode === 'light') {
        this.switchMode('camera');
      }
    }

    // Switch to camera mode if camera values changed while in light mode
    if (cameraChanged && this.currentMode === 'light') {
      this.switchMode('camera');
    }

    // Switch to light mode if light values changed while in camera mode AND light is enabled
    const lightChanged = (newState.lightAzimuth !== undefined && newState.lightAzimuth !== this.state.lightAzimuth) ||
      (newState.lightElevation !== undefined && newState.lightElevation !== this.state.lightElevation);
    if (lightChanged && this.currentMode === 'camera' && this.state.enableLight) {
      this.switchMode('light');
    }

    this.updateDisplay();
    this.updateVisuals();
  }

  private updateHSVFromHex(hex: string) {
    if (!hex) return;
    const c = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    this.liveH = hsl.h;
    this.liveS = hsl.s;
    this.liveV = 1;
  }

  // Color Picker Methods - Using Native Browser Picker
  public openColorPicker(): void {
    // Create a hidden native color input
    let input = document.getElementById('tk-native-color-input') as HTMLInputElement;
    if (!input) {
      input = document.createElement('input');
      input.id = 'tk-native-color-input';
      input.type = 'color';
      input.style.position = 'fixed';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      document.body.appendChild(input);

      input.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value;
        this.state.lightColor = val;
        this.updateDisplay();
        this.updateVisuals();
      });

      input.addEventListener('change', (e) => {
        const val = (e.target as HTMLInputElement).value;
        this.state.lightColor = val;
        this.updateDisplay();
        this.updateVisuals();
        this.notifyStateChange();
      });
    }

    // Position input near the COLOR button so picker appears nearby
    const colorBtn = this.container.querySelector('#param-light-color') as HTMLElement;
    if (colorBtn) {
      const rect = colorBtn.getBoundingClientRect();
      input.style.left = `${rect.right + 10}px`;
      input.style.top = `${rect.top}px`;
    }

    input.value = this.state.lightColor;
    input.click();
  }

  // Legacy methods kept for compatibility
  private closeColorPicker(): void {
    if (this.colorPickerOverlay) {
      this.colorPickerOverlay.remove();
      this.colorPickerOverlay = null;
    }
  }

  private handleHueRingClick(_e: MouseEvent, _ring: HTMLElement, _cursor: HTMLElement, _triangle: HTMLElement, _preview: HTMLElement, _hexInput: HTMLInputElement) { }
  private handleSVClick(_e: MouseEvent, _triangle: HTMLElement, _cursor: HTMLElement, _preview: HTMLElement, _hexInput: HTMLInputElement) { }
  private positionHueCursor(_cursor: HTMLElement, _hue: number) { }
  private updateTriangleGradient(_triangle: HTMLElement, _hue: number) { }
  private updateColorPreview(_preview: HTMLElement, _hexInput: HTMLInputElement) { }


  public dispose() { }
  public setCameraView(_enabled: boolean) { }
  public updateImage(url: string | null): void {
    if (url) {
      const img = new Image();
      if (!url.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        this.planeMat.map = tex;
        this.planeMat.color.set(0xffffff);
        this.planeMat.needsUpdate = true;

        const ar = img.width / img.height;
        const maxSize = 1.2;
        let scaleX: number, scaleY: number;
        if (ar > 1) {
          scaleX = maxSize;
          scaleY = maxSize / ar;
        } else {
          scaleY = maxSize;
          scaleX = maxSize * ar;
        }
        this.imagePlane.scale.set(scaleX, scaleY, 1);
        this.imageFrame.scale.set(scaleX, scaleY, 1);
      };
      img.onerror = () => {
        this.planeMat.map = null;
        this.planeMat.color.set(0xE93D82);
        this.planeMat.needsUpdate = true;
      };
      img.src = url;
    } else {
      this.planeMat.map = null;
      this.planeMat.color.set(0x222233);
      this.planeMat.needsUpdate = true;
      this.imagePlane.scale.set(1, 1, 1);
      this.imageFrame.scale.set(1, 1, 1);
    }
  }
  private resetToDefaults() {
    if (this.currentMode === 'camera') {
      this.state.azimuth = 0; this.state.elevation = 0; this.state.distance = 5;
      this.liveAzimuth = 0; this.liveElevation = 0; this.liveDistance = 5;
    } else {
      this.state.lightAzimuth = 45; this.state.lightElevation = 45; this.state.lightColor = '#ffffff';
      this.liveLightAzimuth = 45; this.liveLightElevation = 45;
      this.updateHSVFromHex('#ffffff');
    }
    this.updateDisplay(); this.updateVisuals(); this.notifyStateChange();
  }
}
