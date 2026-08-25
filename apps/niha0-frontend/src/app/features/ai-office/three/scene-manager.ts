import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ceoOfficeStateEqual,
  type CeoOfficeState,
} from '../../../core/approval/ceo-approval.models';
import {
  DATA_LIBRARIES,
  type WorkspaceEntity,
} from '../../../core/workspace/workspace-catalog';
import {
  CAMERA_DEFAULT_FOV,
  CAMERA_ROOM_PADDING,
  applyFramingToCamera,
  initializeRoomCamera,
  type RoomCameraFraming,
} from './camera-framing';
import { createCartoonAvatar } from './avatar.factory';
import { updateCeoAvatarVisuals } from './ceo-avatar.factory';
import {
  triggerBellPress,
  updateCeoBellVisuals,
  updateCeoDoorVisuals,
  type CeoDoorParts,
} from './ceo-door.factory';
import { createAgentDesk, createCeoOffice, type CeoOfficeOptions } from './desk.factory';
import {
  resolveAgentVisualStatus,
  STATUS_TINT,
  blendHex,
  statusLabelFr,
} from './agent-status-visuals';
import { createFocusRing, setFocusRingAccent, setFocusRingState } from './focus-ring.factory';
import {
  pulseObjectClick,
  setEmissiveBoost,
  type SceneTooltipPayload,
} from './interaction-feedback';
import { createDataLibrary, setLibraryVisualState } from './library.factory';
import { buildOfficeEnvironment } from './office-builder';
import { accentForCode, getPalette } from './theme-palette';
import { applyPresetPalette, loadScenePreset } from './scene-presets';
import type { AgentDeskConfig, AvatarState, ScenePalette, SceneTheme } from './types';
import { createComicDialoguePair } from './ui/comic-dialogue.factory';
import {
  CEO_DOOR_OBSTACLE,
  doorObstacleActive,
  segmentCrossesObstacle,
  type DoorAccessState,
} from './navigation.types';
import { activeDoorObstacles, findPath } from './pathfinding';
import {
  createSpeechBubble,
  disposeSpeechBubble,
  fadeBubbleIn,
  fadeBubbleOut,
  setBubbleText,
  tickBubbleFade,
} from './ui/speech-bubble.factory';

/** Desk (x, z) by agent code — 3 poles on the right. */
const DESK_BY_CODE: Record<string, [number, number]> = {
  // Pôle Clients (front-right, +z)
  CRM: [-2, 3],
  VENTES: [1, 3],
  SUPPORT: [4, 3],
  MARKETING: [7, 3],
  // Pôle Gestion (mid)
  ERP: [-2, 0],
  COMPTABILITE: [1, 0],
  RH: [4, 0],
  JURIDIQUE: [7, 0],
  // Pôle Ops (back, -z)
  STOCK: [-1, -3],
  ANALYTICS: [2.5, -3],
  STRATEGIE: [6, -3],
};

const DESK_POSITIONS: Array<[number, number, number]> = [
  [-2, 0, 3],
  [1, 0, 3],
  [4, 0, 3],
  [7, 0, 3],
  [-2, 0, 0],
  [1, 0, 0],
  [4, 0, 0],
  [7, 0, 0],
  [-1, 0, -3],
  [2.5, 0, -3],
  [6, 0, -3],
];

const CEO_POS = new THREE.Vector3(-10, 0, 0);
/** Wait spot in front of the glass door (+x side of CEO office). */
const DOOR_WAIT_POS = new THREE.Vector3(-7.5, 0, 0);
const WAIT_POS = DOOR_WAIT_POS;
/** Hold point before the glass door when it is closed. */
const DOOR_HOLD_POS = new THREE.Vector3(-5.8, 0, 0);
const AISLE_X = -4.5;

const TASK_STATUSES = new Set(['THINKING', 'PREPARING', 'EXECUTING']);

function ceoOptionsEqual(a: CeoOfficeOptions, b: CeoOfficeOptions): boolean {
  if (a === b) return true;
  if (a.companyName !== b.companyName) return false;
  if (a.ownerLabel !== b.ownerLabel) return false;
  if (a.logoUrl !== b.logoUrl) return false;
  const ba = a.branding;
  const bb = b.branding;
  if (ba === bb) return true;
  if (!ba || !bb) return ba == null && bb == null;
  return (
    ba.themePreset === bb.themePreset &&
    ba.primaryColor === bb.primaryColor &&
    ba.secondaryColor === bb.secondaryColor &&
    ba.accentColor === bb.accentColor &&
    ba.carpetStyle === bb.carpetStyle &&
    ba.carpetText === bb.carpetText
  );
}

interface AgentRuntime {
  config: AgentDeskConfig;
  desk: THREE.Group;
  avatar: THREE.Group;
  focusRing: THREE.Group;
  home: THREE.Vector3;
  state: AvatarState;
  path: THREE.Vector3[];
  pathIndex: number;
  walkT: number;
  taskBubble: THREE.Sprite | null;
  dialogueAgent: THREE.Sprite | null;
  dialogueCeo: THREE.Sprite | null;
  approvalMarker: THREE.Mesh | null;
}

interface LibraryRuntime {
  entity: WorkspaceEntity;
  group: THREE.Group;
}

type SelectKind = 'agent' | 'ceo' | 'library' | 'bell';
type SelectCallback = (kind: SelectKind, id?: string) => void;
type ApprovalSceneCallback = (event: 'agent-moving' | 'agent-at-door' | 'bell-click', agentId?: string) => void;
type TooltipCallback = (payload: SceneTooltipPayload) => void;

export class OfficeSceneManager {
  private readonly host: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private clock = new THREE.Clock();
  private animId = 0;
  private theme: SceneTheme = 'SOLARPUNK';
  private palette: ScenePalette = getPalette('SOLARPUNK');
  private agents: AgentRuntime[] = [];
  private libraries: LibraryRuntime[] = [];
  private ceoGroup: THREE.Group | null = null;
  private ceoDoorParts: CeoDoorParts | null = null;
  private ceoAvatar: THREE.Group | null = null;
  private ceoOfficeState: CeoOfficeState | null = null;
  private bellHovered = false;
  private hoveredCeo = false;
  private bellRingUntil = 0;
  private selectCb: SelectCallback | null = null;
  private approvalCb: ApprovalSceneCallback | null = null;
  private focusCb: SelectCallback | null = null;
  private tooltipCb: TooltipCallback | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private reducedMotion = false;
  private motionMq: MediaQueryList | null = null;
  private readonly onMotionChange = (): void => {
    this.reducedMotion = this.motionMq?.matches ?? false;
  };
  private disposed = false;
  private rebuilding = false;
  private bubblesEnabled = true;
  private ceoOptions: CeoOfficeOptions = {};

  private yaw = 0;
  private targetYaw = 0;
  private orbitRadius = 18;
  private orbitHeight = 11;
  private lookAtTarget = new THREE.Vector3(-1, 0.5, 0);
  private lookAtCurrent = new THREE.Vector3(-1, 0.5, 0);
  private focusOrbitRadius: number | null = null;
  private desiredCameraPos: THREE.Vector3 | null = null;
  private homeFraming: RoomCameraFraming | null = null;
  private minOrbitRadius = 10;
  private maxOrbitRadius = 48;
  private dragMoved = false;
  private pointerDownX = 0;
  private pointerDownY = 0;

  private hoveredAgentId: string | null = null;
  private hoveredLibraryId: string | null = null;
  private selectedAgentId: string | null = null;
  private selectedLibraryId: string | null = null;
  private keyboardFocusIndex = 0;

  private resizeObserver: ResizeObserver | null = null;
  private readonly onPointerDown = (e: PointerEvent) => this.handlePointerDown(e);
  private readonly onPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
  private readonly onPointerUp = () => this.handlePointerUp();
  private readonly onClick = (e: MouseEvent) => this.handleClick(e);
  private readonly onVisibility = () => {
    if (!document.hidden) this.clock.getDelta();
  };

  constructor(host: HTMLElement) {
    this.host = host;
  }

  init(theme: SceneTheme, agents: AgentDeskConfig[], ceoOptions: CeoOfficeOptions = {}): void {
    if (this.disposed) return;
    this.theme = theme;
    this.palette = applyPresetPalette(getPalette(theme), loadScenePreset());
    this.ceoOptions = ceoOptions;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionMq.addEventListener('change', this.onMotionChange);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      const gl = renderer.getContext();
      if (!gl) throw new Error('WebGL context unavailable');
    } catch (err) {
      throw new Error(`WebGL failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const lowShadowBudget =
      window.matchMedia('(max-width: 900px)').matches || window.devicePixelRatio >= 2.5;
    renderer.shadowMap.enabled = !lowShadowBudget;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme === 'SOLARPUNK' ? 0.95 : 1.0;

    const w = this.host.clientWidth || 800;
    const h = this.host.clientHeight || 500;
    renderer.setSize(w, h);
    this.host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA_DEFAULT_FOV, w / h, 0.15, 180);
    this.orbitRadius = 18;
    this.orbitHeight = 11;
    this.yaw = 0.2;
    this.targetYaw = 0.2;
    this.lookAtTarget.set(-1, 0.5, 0);
    this.lookAtCurrent.copy(this.lookAtTarget);
    this.camera.position.set(Math.sin(this.yaw) * this.orbitRadius, this.orbitHeight, Math.cos(this.yaw) * this.orbitRadius);
    this.camera.lookAt(this.lookAtCurrent);

    buildOfficeEnvironment(this.scene, this.palette, this.theme);
    this.spawnCeo();
    this.spawnAgents(agents);
    this.spawnLibraries();
    this.applyHomeFraming();
    if (this.renderer) {
      this.renderer.setClearColor(this.palette.bg);
    }

    this.host.addEventListener('pointerdown', this.onPointerDown);
    this.host.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    renderer.domElement.addEventListener('click', this.onClick);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('role', 'application');
    renderer.domElement.setAttribute(
      'aria-label',
      'AI Office 3D — orbit souris, molette pour zoomer, flèches pour naviguer, Entrée pour sélectionner',
    );

    this.setupOrbitControls(renderer);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.host);

    document.addEventListener('visibilitychange', this.onVisibility);
    this.clock.start();
    this.animate();
  }

  private setupOrbitControls(renderer: THREE.WebGLRenderer): void {
    if (!this.camera) return;
    this.controls?.dispose();
    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.95;
    controls.rotateSpeed = 0.55;
    controls.panSpeed = 0.6;
    controls.minDistance = this.minOrbitRadius;
    controls.maxDistance = this.maxOrbitRadius;
    // Keep camera above the floor; avoid flipping under the room.
    if (this.homeFraming) {
      controls.minPolarAngle = this.homeFraming.minPolarAngle;
      controls.maxPolarAngle = this.homeFraming.maxPolarAngle;
    } else {
      controls.minPolarAngle = 0.18;
      controls.maxPolarAngle = Math.PI * 0.46;
    }
    controls.target.copy(this.lookAtTarget);
    controls.update();
    this.controls = controls;
  }

  setCeoOptions(options: CeoOfficeOptions): void {
    this.applySceneAppearance(this.theme, options);
  }

  setTheme(theme: SceneTheme): void {
    this.applySceneAppearance(theme, this.ceoOptions);
  }

  /** Rebuild only when theme or CEO branding actually changed (prevents Firefox freezes). */
  applySceneAppearance(theme: SceneTheme, options: CeoOfficeOptions): void {
    if (this.disposed) return;
    if (!this.scene) {
      this.theme = theme;
      this.palette = applyPresetPalette(getPalette(theme), loadScenePreset());
      this.ceoOptions = options;
      return;
    }
    const themeChanged = theme !== this.theme;
    const optionsChanged = !ceoOptionsEqual(this.ceoOptions, options);
    if (!themeChanged && !optionsChanged) return;
    if (this.rebuilding) return;

    this.theme = theme;
    this.palette = applyPresetPalette(getPalette(theme), loadScenePreset());
    this.ceoOptions = options;
    if (this.renderer) {
      this.renderer.toneMappingExposure = theme === 'SOLARPUNK' ? 0.95 : 1.0;
    }
    this.rebuildSceneGraph(true);
  }

  setCeoOfficeState(state: CeoOfficeState): void {
    if (this.disposed) return;
    const prev = this.ceoOfficeState;
    if (prev && ceoOfficeStateEqual(prev, state)) return;
    this.ceoOfficeState = state;
    // Ring only on transition into ringing — avoid resetting the timer every effect tick.
    if (state.bellState === 'ringing' && prev?.bellState !== 'ringing') {
      this.bellRingUntil = performance.now() + 2800;
    }
  }

  onApprovalEvent(cb: ApprovalSceneCallback): void {
    this.approvalCb = cb;
  }

  syncAgentStates(agents: AgentDeskConfig[]): void {
    const byId = new Map(agents.map((a) => [a.id, a]));
    for (const runtime of this.agents) {
      const next = byId.get(runtime.config.id);
      if (!next) continue;
      runtime.config = next;
      const wantsCeo = next.status === 'WAITING_APPROVAL';
      if (wantsCeo && (runtime.state === 'SEATED' || runtime.state === 'RETURNING')) {
        this.beginWalkToCeo(runtime);
      } else if (!wantsCeo && (runtime.state === 'WALKING_TO_CEO' || runtime.state === 'WAITING_AT_CEO')) {
        this.beginReturnHome(runtime);
      }
      this.updateAgentRingAccent(runtime);
      this.syncBubblesForAgent(runtime);
    }
  }

  /** Animate camera toward an agent desk by code or id. */
  focusAgent(codeOrId: string): void {
    const runtime = this.agents.find(
      (a) => a.config.id === codeOrId || a.config.code === codeOrId,
    );
    if (!runtime || !this.camera) return;
    this.selectedAgentId = runtime.config.id;
    this.selectedLibraryId = null;
    this.syncKeyboardIndexToSelection();
    this.applySelectionVisuals();
    this.lookAtTarget.set(runtime.home.x, 1.2, runtime.home.z);
    const dx = runtime.home.x;
    const dz = runtime.home.z;
    this.targetYaw = Math.atan2(dx * 0.15, 12);
    this.yaw = this.targetYaw;
    const focus = Math.hypot(dx, dz) * 0.55 + 8;
    this.focusOrbitRadius = Math.max(
      this.minOrbitRadius,
      Math.min(this.maxOrbitRadius * 0.55, Math.max(10, Math.min(16, focus))),
    );
    this.desiredCameraPos = new THREE.Vector3(
      Math.sin(this.yaw) * this.focusOrbitRadius + this.lookAtTarget.x * 0.15,
      Math.max(6, this.focusOrbitRadius * 0.48),
      Math.cos(this.yaw) * this.focusOrbitRadius + this.lookAtTarget.z * 0.15,
    );
    if (this.reducedMotion) {
      this.lookAtCurrent.copy(this.lookAtTarget);
      this.camera.position.copy(this.desiredCameraPos);
      if (this.controls) {
        this.controls.target.copy(this.lookAtTarget);
        this.controls.update();
      }
      this.desiredCameraPos = null;
    }
  }

  focusLibrary(libraryId: string): void {
    const runtime = this.libraries.find((l) => l.entity.id === libraryId.toUpperCase());
    if (!runtime || !this.camera) return;
    this.selectedLibraryId = runtime.entity.id;
    this.selectedAgentId = null;
    this.syncKeyboardIndexToSelection();
    this.applySelectionVisuals();
    const [x, , z] = runtime.entity.position3D;
    this.lookAtTarget.set(x, 1.4, z);
    this.targetYaw = Math.atan2(x * 0.12, 14);
    this.yaw = this.targetYaw;
    this.focusOrbitRadius = Math.max(this.minOrbitRadius, Math.min(14, this.maxOrbitRadius * 0.5));
    this.desiredCameraPos = new THREE.Vector3(
      Math.sin(this.yaw) * this.focusOrbitRadius + this.lookAtTarget.x * 0.12,
      Math.max(6, this.focusOrbitRadius * 0.5),
      Math.cos(this.yaw) * this.focusOrbitRadius + this.lookAtTarget.z * 0.12,
    );
    if (this.reducedMotion) {
      this.lookAtCurrent.copy(this.lookAtTarget);
      this.camera.position.copy(this.desiredCameraPos);
      if (this.controls) {
        this.controls.target.copy(this.lookAtTarget);
        this.controls.update();
      }
      this.desiredCameraPos = null;
    }
  }

  /** Frame the CEO office / glass door for approval workflows. */
  focusCeo(): void {
    if (!this.camera) return;
    this.selectedAgentId = null;
    this.selectedLibraryId = null;
    this.syncKeyboardIndexToSelection();
    this.applySelectionVisuals();
    this.lookAtTarget.set(CEO_POS.x + 1.2, 1.5, CEO_POS.z);
    this.targetYaw = Math.atan2(-0.35, 1);
    this.yaw = this.targetYaw;
    this.focusOrbitRadius = Math.max(this.minOrbitRadius, Math.min(14, this.maxOrbitRadius * 0.48));
    this.desiredCameraPos = new THREE.Vector3(
      Math.sin(this.yaw) * this.focusOrbitRadius + this.lookAtTarget.x * 0.2,
      Math.max(6.5, this.focusOrbitRadius * 0.52),
      Math.cos(this.yaw) * this.focusOrbitRadius + this.lookAtTarget.z * 0.2,
    );
    if (this.reducedMotion) {
      this.lookAtCurrent.copy(this.lookAtTarget);
      this.camera.position.copy(this.desiredCameraPos);
      if (this.controls) {
        this.controls.target.copy(this.lookAtTarget);
        this.controls.update();
      }
      this.desiredCameraPos = null;
    }
  }

  setSelectedAgent(agentId: string | null): void {
    this.selectedAgentId = agentId;
    if (agentId) this.selectedLibraryId = null;
    this.syncKeyboardIndexToSelection();
    this.applySelectionVisuals();
  }

  setSelectedLibrary(libraryId: string | null): void {
    this.selectedLibraryId = libraryId ? libraryId.toUpperCase() : null;
    if (libraryId) this.selectedAgentId = null;
    this.syncKeyboardIndexToSelection();
    this.applySelectionVisuals();
  }

  clearHover(): void {
    this.hoveredAgentId = null;
    this.hoveredLibraryId = null;
    if (this.hoveredCeo && this.ceoGroup) {
      setEmissiveBoost(this.ceoGroup, false);
    }
    this.hoveredCeo = false;
    this.bellHovered = false;
    this.applySelectionVisuals();
    if (this.renderer) this.renderer.domElement.style.cursor = 'default';
    this.emitTooltipHidden();
  }

  setBubblesEnabled(enabled: boolean): void {
    this.bubblesEnabled = enabled;
    for (const runtime of this.agents) {
      if (!enabled) {
        this.hideAllBubbles(runtime);
      } else {
        this.syncBubblesForAgent(runtime);
      }
    }
  }

  onSelect(cb: SelectCallback): void {
    this.selectCb = cb;
  }

  onFocusChange(cb: SelectCallback): void {
    this.focusCb = cb;
  }

  onTooltip(cb: TooltipCallback): void {
    this.tooltipCb = cb;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animId);
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    this.host.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.motionMq?.removeEventListener('change', this.onMotionChange);
    this.motionMq = null;
    this.renderer?.domElement.removeEventListener('click', this.onClick);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    this.controls = null;
    this.teardownSceneGraph();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
    this.camera = null;
    this.scene = null;
    this.selectCb = null;
    this.focusCb = null;
    this.approvalCb = null;
    this.emitTooltipHidden();
    this.tooltipCb = null;
    this.agents = [];
    this.libraries = [];
    this.ceoGroup = null;
    this.ceoDoorParts = null;
    this.ceoAvatar = null;
    this.ceoOfficeState = null;
    this.rebuilding = false;
  }

  private rebuildSceneGraph(preserveCamera = false): void {
    if (!this.scene || this.disposed || this.rebuilding) return;
    this.rebuilding = true;
    try {
      const configs = this.agents.map((a) => a.config);
      const savedCamPos = this.camera?.position.clone() ?? null;
      const savedTarget = this.controls?.target.clone() ?? this.lookAtTarget.clone();
      const savedFocusOrbit = this.focusOrbitRadius;

      this.teardownSceneGraph();
      this.scene.background = new THREE.Color(this.palette.bg);
      buildOfficeEnvironment(this.scene, this.palette, this.theme);
      this.spawnCeo();
      this.spawnAgents(configs);
      this.spawnLibraries();

      if (preserveCamera && savedCamPos && this.camera && this.controls) {
        this.lookAtTarget.copy(savedTarget);
        this.lookAtCurrent.copy(savedTarget);
        this.controls.target.copy(savedTarget);
        this.camera.position.copy(savedCamPos);
        this.focusOrbitRadius = savedFocusOrbit;
        this.desiredCameraPos = null;
        this.controls.minDistance = this.minOrbitRadius;
        this.controls.maxDistance = this.maxOrbitRadius;
        this.controls.update();
        this.applyHomeFraming(true);
      } else {
        this.applyHomeFraming(false);
      }

      if (this.renderer) {
        this.renderer.setClearColor(this.palette.bg);
      }

      this.applySelectionVisuals();
    } finally {
      this.rebuilding = false;
    }
  }

  private teardownSceneGraph(): void {
    if (!this.scene) return;
    for (const runtime of this.agents) {
      this.disposeAgentBubbles(runtime);
      this.disposeApprovalMarker(runtime);
    }
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Sprite) {
        const sm = obj.material;
        if (sm instanceof THREE.SpriteMaterial) sm.dispose();
      }
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
        else m?.dispose();
      }
      if (obj instanceof THREE.Light && 'dispose' in obj && typeof (obj as THREE.Light & { dispose?: () => void }).dispose === 'function') {
        (obj as THREE.Light & { dispose: () => void }).dispose();
      }
    });
    while (this.scene.children.length) {
      this.scene.remove(this.scene.children[0]);
    }
    this.agents = [];
    this.libraries = [];
    this.ceoGroup = null;
    this.ceoDoorParts = null;
    this.ceoAvatar = null;
  }

  private spawnCeo(): void {
    if (!this.scene) return;
    this.ceoGroup = createCeoOffice(this.palette, this.ceoOptions);
    this.ceoGroup.position.copy(CEO_POS);
    this.ceoGroup.userData['type'] = 'ceo';
    this.ceoDoorParts = (this.ceoGroup.userData['doorParts'] as CeoDoorParts | undefined) ?? null;
    this.ceoAvatar = (this.ceoGroup.userData['ceoAvatar'] as THREE.Group | undefined) ?? null;
    this.scene.add(this.ceoGroup);
  }

  private spawnAgents(agents: AgentDeskConfig[]): void {
    if (!this.scene) return;
    this.agents = [];
    const list = agents.slice(0, 11);
    list.forEach((cfg, i) => {
      const fromCode = DESK_BY_CODE[cfg.code];
      const [x, y, z] = fromCode
        ? ([fromCode[0], 0, fromCode[1]] as [number, number, number])
        : (DESK_POSITIONS[i] ?? DESK_POSITIONS[0]);
      const accent = accentForCode(cfg.code);
      const desk = createAgentDesk(cfg.name || cfg.code, accent, this.palette, cfg.code);
      desk.position.set(x, y, z);
      desk.userData['type'] = 'desk';
      desk.userData['agentId'] = cfg.id;
      this.scene!.add(desk);

      const avatar = createCartoonAvatar(cfg.code, accent);
      const home = new THREE.Vector3(x, 0, z + 0.55);
      avatar.position.copy(home);
      avatar.userData['agentId'] = cfg.id;
      avatar.userData['type'] = 'avatar';
      this.scene!.add(avatar);

      const focusRing = createFocusRing(cfg.id, accent);
      focusRing.position.set(x, focusRing.position.y, z);
      this.scene!.add(focusRing);

      const runtime: AgentRuntime = {
        config: cfg,
        desk,
        avatar,
        focusRing,
        home: home.clone(),
        state: 'SEATED',
        path: [],
        pathIndex: 0,
        walkT: 0,
        taskBubble: null,
        dialogueAgent: null,
        dialogueCeo: null,
        approvalMarker: null,
      };

      this.updateAgentRingAccent(runtime);

      if (cfg.status === 'WAITING_APPROVAL') {
        this.beginWalkToCeo(runtime);
      }
      this.syncBubblesForAgent(runtime);

      this.agents.push(runtime);
    });
  }

  private spawnLibraries(): void {
    if (!this.scene) return;
    this.libraries = [];
    for (const entity of DATA_LIBRARIES) {
      const group = createDataLibrary(entity, this.palette);
      const [x, y, z] = entity.position3D;
      group.position.set(x, y, z);
      // Face the room (+z) from the back wall toward the CEO desk.
      group.rotation.y = 0;
      this.scene.add(group);
      this.libraries.push({ entity, group });
    }
  }

  private beginWalkToCeo(runtime: AgentRuntime): void {
    this.approvalCb?.('agent-moving', runtime.config.id);
    if (this.reducedMotion) {
      runtime.avatar.position.copy(WAIT_POS);
      runtime.state = 'WAITING_AT_CEO';
      runtime.path = [];
      this.onAgentArrivedAtDoor(runtime);
      this.syncBubblesForAgent(runtime);
      return;
    }
    const doorClosed = this.isCeoDoorBlocking();
    const goal = doorClosed ? DOOR_HOLD_POS : WAIT_POS;
    const obstacles = activeDoorObstacles(doorClosed, CEO_DOOR_OBSTACLE);
    const waypoints = findPath(
      { x: runtime.avatar.position.x, z: runtime.avatar.position.z },
      { x: goal.x, z: goal.z },
      obstacles,
    );
    runtime.path = waypoints.length
      ? waypoints.map((w) => new THREE.Vector3(w.x, 0, w.z))
      : [runtime.avatar.position.clone(), goal.clone()];
    runtime.pathIndex = 0;
    runtime.walkT = 0;
    runtime.state = 'WALKING_TO_CEO';
    this.syncApprovalMarker(runtime, true);
  }

  private isCeoDoorBlocking(): boolean {
    const doorState = (this.ceoOfficeState?.doorState ?? 'closed') as DoorAccessState;
    return doorObstacleActive(doorState);
  }

  /** When door opens, agent waiting at hold point continues to the CEO door. */
  private resumeWalkToCeoIfDoorOpen(runtime: AgentRuntime): void {
    if (runtime.state !== 'WALKING_TO_CEO' && runtime.state !== 'WAITING_AT_CEO') return;
    if (this.isCeoDoorBlocking()) return;
    const atHold =
      runtime.avatar.position.distanceToSquared(DOOR_HOLD_POS) < 0.35 ||
      (runtime.path.length === 0 && runtime.avatar.position.x < -5.5);
    if (!atHold && runtime.state !== 'WAITING_AT_CEO') return;
    runtime.path = [runtime.avatar.position.clone(), WAIT_POS.clone()];
    runtime.pathIndex = 0;
    runtime.walkT = 0;
    runtime.state = 'WALKING_TO_CEO';
  }

  private beginReturnHome(runtime: AgentRuntime): void {
    this.clearDialogueBubbles(runtime);
    this.syncApprovalMarker(runtime, false);
    runtime.avatar.userData['doorNotified'] = false;
    if (this.reducedMotion) {
      runtime.avatar.position.copy(runtime.home);
      runtime.state = 'SEATED';
      runtime.path = [];
      this.syncBubblesForAgent(runtime);
      return;
    }
    const doorClosed = this.isCeoDoorBlocking();
    const obstacles = activeDoorObstacles(doorClosed, CEO_DOOR_OBSTACLE);
    const waypoints = findPath(
      { x: runtime.avatar.position.x, z: runtime.avatar.position.z },
      { x: runtime.home.x, z: runtime.home.z },
      obstacles,
    );
    runtime.path = waypoints.length
      ? waypoints.map((w) => new THREE.Vector3(w.x, 0, w.z))
      : [
          runtime.avatar.position.clone(),
          new THREE.Vector3(AISLE_X, 0, 0),
          new THREE.Vector3(AISLE_X, 0, runtime.home.z),
          runtime.home.clone(),
        ];
    runtime.pathIndex = 0;
    runtime.walkT = 0;
    runtime.state = 'RETURNING';
  }

  private syncBubblesForAgent(runtime: AgentRuntime): void {
    if (!this.scene || !this.bubblesEnabled) {
      this.hideAllBubbles(runtime);
      return;
    }

    const status = runtime.config.status;
    const accent = accentForCode(runtime.config.code);

    if (status === 'WAITING_APPROVAL' || runtime.state === 'WAITING_AT_CEO' || runtime.state === 'WALKING_TO_CEO') {
      this.clearTaskBubble(runtime);
      const agentText =
        runtime.config.dialogueText ||
        runtime.config.pendingTitle ||
        `${runtime.config.name || runtime.config.code} : proposition`;
      const ceoText = 'Examiner la proposition';

      if (!runtime.dialogueAgent || !runtime.dialogueCeo) {
        this.clearDialogueBubbles(runtime);
        const pair = createComicDialoguePair(agentText, ceoText);
        runtime.dialogueAgent = pair.agentBubble;
        runtime.dialogueCeo = pair.ceoBubble;
        this.scene.add(pair.agentBubble);
        this.scene.add(pair.ceoBubble);
      } else {
        setBubbleText(runtime.dialogueAgent, agentText, accent);
        setBubbleText(runtime.dialogueCeo, ceoText, this.palette.ceo);
      }

      // Show agent bubble while walking / waiting; CEO reply when waiting
      fadeBubbleIn(runtime.dialogueAgent, this.reducedMotion);
      if (runtime.state === 'WAITING_AT_CEO') {
        fadeBubbleIn(runtime.dialogueCeo, this.reducedMotion);
      } else if (runtime.dialogueCeo) {
        fadeBubbleOut(runtime.dialogueCeo, this.reducedMotion);
      }
      return;
    }

    this.clearDialogueBubbles(runtime);

    if (TASK_STATUSES.has(status) && runtime.config.bubbleText) {
      if (!runtime.taskBubble) {
        runtime.taskBubble = createSpeechBubble(runtime.config.bubbleText, accent);
        this.scene.add(runtime.taskBubble);
      } else {
        setBubbleText(runtime.taskBubble, runtime.config.bubbleText, accent);
      }
      fadeBubbleIn(runtime.taskBubble, this.reducedMotion);
    } else {
      this.clearTaskBubble(runtime);
    }
  }

  private hideAllBubbles(runtime: AgentRuntime): void {
    if (runtime.taskBubble) fadeBubbleOut(runtime.taskBubble, this.reducedMotion);
    if (runtime.dialogueAgent) fadeBubbleOut(runtime.dialogueAgent, this.reducedMotion);
    if (runtime.dialogueCeo) fadeBubbleOut(runtime.dialogueCeo, this.reducedMotion);
  }

  private clearTaskBubble(runtime: AgentRuntime): void {
    if (!runtime.taskBubble) return;
    if (this.scene) this.scene.remove(runtime.taskBubble);
    disposeSpeechBubble(runtime.taskBubble);
    runtime.taskBubble = null;
  }

  private clearDialogueBubbles(runtime: AgentRuntime): void {
    if (runtime.dialogueAgent) {
      if (this.scene) this.scene.remove(runtime.dialogueAgent);
      disposeSpeechBubble(runtime.dialogueAgent);
      runtime.dialogueAgent = null;
    }
    if (runtime.dialogueCeo) {
      if (this.scene) this.scene.remove(runtime.dialogueCeo);
      disposeSpeechBubble(runtime.dialogueCeo);
      runtime.dialogueCeo = null;
    }
  }

  private disposeAgentBubbles(runtime: AgentRuntime): void {
    this.clearTaskBubble(runtime);
    this.clearDialogueBubbles(runtime);
  }

  private disposeApprovalMarker(runtime: AgentRuntime): void {
    if (!runtime.approvalMarker) return;
    if (this.scene) this.scene.remove(runtime.approvalMarker);
    runtime.approvalMarker.geometry.dispose();
    const m = runtime.approvalMarker.material;
    if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
    else m.dispose();
    runtime.approvalMarker = null;
  }

  private syncApprovalMarker(runtime: AgentRuntime, visible: boolean): void {
    if (!this.scene) return;
    const waiting =
      visible &&
      (runtime.config.status === 'WAITING_APPROVAL' ||
        runtime.state === 'WAITING_AT_CEO' ||
        runtime.state === 'WALKING_TO_CEO');
    if (!waiting) {
      this.disposeApprovalMarker(runtime);
      return;
    }
    const accent = accentForCode(runtime.config.code);
    if (!runtime.approvalMarker) {
      runtime.approvalMarker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
          color: accent,
          emissive: accent,
          emissiveIntensity: 0.65,
          metalness: 0.2,
          roughness: 0.35,
          transparent: true,
          opacity: 0.92,
        }),
      );
      runtime.approvalMarker.userData['type'] = 'approval-marker';
      this.scene.add(runtime.approvalMarker);
    }
    const mat = runtime.approvalMarker.material;
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.opacity = 0.98;
      mat.emissiveIntensity = 0.78;
    }
    runtime.approvalMarker.position.set(
      runtime.avatar.position.x,
      runtime.avatar.position.y + 1.65,
      runtime.avatar.position.z,
    );
  }

  private onAgentArrivedAtDoor(runtime: AgentRuntime): void {
    if (runtime.avatar.userData['doorNotified']) return;
    runtime.avatar.userData['doorNotified'] = true;
    this.approvalCb?.('agent-at-door', runtime.config.id);
    if (this.ceoDoorParts) {
      triggerBellPress(this.ceoDoorParts);
    }
    this.bellRingUntil = performance.now() + 2800;
    this.syncApprovalMarker(runtime, true);
  }

  private positionBubbles(runtime: AgentRuntime): void {
    const av = runtime.avatar.position;
    if (runtime.taskBubble) {
      runtime.taskBubble.position.set(av.x, av.y + 2.1, av.z);
    }
    if (runtime.dialogueAgent) {
      runtime.dialogueAgent.position.set(av.x + 0.3, av.y + 2.15, av.z);
    }
    if (runtime.dialogueCeo) {
      runtime.dialogueCeo.position.set(CEO_POS.x + 1.2, 2.4, CEO_POS.z + 0.8);
    }
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.animId = requestAnimationFrame(this.animate);
    if (document.hidden) return;
    if (!this.renderer || !this.scene || !this.camera) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // Programmatic camera focus vs user OrbitControls (do not fight pan/orbit).
    const programmaticFocus =
      this.desiredCameraPos != null ||
      this.lookAtCurrent.distanceToSquared(this.lookAtTarget) > 0.0004;

    if (programmaticFocus) {
      this.lookAtCurrent.lerp(this.lookAtTarget, Math.min(1, dt * 3.2));
      if (this.desiredCameraPos && this.camera) {
        this.camera.position.lerp(this.desiredCameraPos, Math.min(1, dt * 2.8));
        if (this.camera.position.distanceTo(this.desiredCameraPos) < 0.08) {
          this.camera.position.copy(this.desiredCameraPos);
          this.desiredCameraPos = null;
        }
      }
      if (this.controls) {
        this.controls.target.copy(this.lookAtCurrent);
      }
    } else if (this.controls) {
      this.lookAtCurrent.copy(this.controls.target);
      this.lookAtTarget.copy(this.controls.target);
    }

    if (this.controls) {
      this.controls.minDistance = this.minOrbitRadius;
      this.controls.maxDistance = this.maxOrbitRadius;
      this.controls.update();
    } else if (this.camera) {
      this.camera.lookAt(this.lookAtCurrent);
    }

    for (const runtime of this.agents) {
      this.resumeWalkToCeoIfDoorOpen(runtime);
      this.updateAgent(runtime, dt, t);
      this.positionBubbles(runtime);
      if (runtime.taskBubble) tickBubbleFade(runtime.taskBubble, dt);
      if (runtime.dialogueAgent) tickBubbleFade(runtime.dialogueAgent, dt);
      if (runtime.dialogueCeo) tickBubbleFade(runtime.dialogueCeo, dt);
      if (runtime.approvalMarker) {
        runtime.approvalMarker.position.x = runtime.avatar.position.x;
        runtime.approvalMarker.position.z = runtime.avatar.position.z;
        if (!this.reducedMotion) {
          runtime.approvalMarker.rotation.y += dt * 2.2;
          runtime.approvalMarker.position.y =
            runtime.avatar.position.y + 1.65 + Math.sin(t * 4 + runtime.home.x) * 0.06;
        } else {
          runtime.approvalMarker.position.y = runtime.avatar.position.y + 1.65;
        }
      }

      // Keep floor ring locked under the desk (XZ)
      runtime.focusRing.position.x = runtime.desk.position.x;
      runtime.focusRing.position.y = 0.035;
      runtime.focusRing.position.z = runtime.desk.position.z;
      const ringState =
        runtime.config.id === this.selectedAgentId
          ? 'selected'
          : runtime.config.id === this.hoveredAgentId
            ? 'hover'
            : 'idle';
      const visual = resolveAgentVisualStatus(runtime.config.status);
      const activityBoost = visual === 'busy' || visual === 'validation';
      if (!this.reducedMotion || ringState !== 'idle' || activityBoost) {
        setFocusRingState(runtime.focusRing, ringState, t, {
          activityBoost,
          reducedMotion: this.reducedMotion,
        });
      }
    }

    for (const lib of this.libraries) {
      const target = (lib.group.userData['targetScale'] as number) ?? 1;
      const cur = lib.group.scale.x;
      const next = cur + (target - cur) * Math.min(1, dt * 10);
      lib.group.scale.setScalar(next);
    }

    // CEO office door, bell, avatar states
    if (this.ceoDoorParts && this.ceoOfficeState) {
      const bellState =
        performance.now() < this.bellRingUntil
          ? 'ringing'
          : this.bellHovered
            ? 'hovered'
            : this.ceoOfficeState.bellState;
      updateCeoDoorVisuals(
        this.ceoDoorParts,
        this.ceoOfficeState.doorState,
        this.palette,
        t,
        this.reducedMotion,
      );
      updateCeoBellVisuals(this.ceoDoorParts, bellState, this.palette, t, this.reducedMotion);
    }
    if (this.ceoAvatar && this.ceoOfficeState) {
      updateCeoAvatarVisuals(
        this.ceoAvatar,
        this.ceoOfficeState.ceoStatus,
        this.palette,
        t,
        this.reducedMotion,
      );
    }
    const wallScreen = this.ceoGroup?.userData['wallScreen'] as THREE.Mesh | undefined;
    if (wallScreen?.material instanceof THREE.MeshStandardMaterial && this.ceoOfficeState) {
      const reviewing = this.ceoOfficeState.ceoStatus === 'reviewing';
      wallScreen.material.emissiveIntensity = reviewing ? 0.45 + Math.sin(t * 3) * 0.12 : 0.25;
    }

    // Soft wait-ring pulse
    if (this.ceoGroup && !this.reducedMotion) {
      this.ceoGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          const s = 1 + Math.sin(t * 2.2) * 0.04;
          child.scale.set(s, s, 1);
        }
      });
    }

    // Data stream bob
    if (!this.reducedMotion) {
      const streams = this.scene.getObjectByName('data-streams');
      streams?.children.forEach((child) => {
        const phase = (child.userData['streamPhase'] as number) ?? 0;
        child.position.y = 0.18 + Math.sin(t * 2.5 + phase) * 0.08;
      });
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateAgent(runtime: AgentRuntime, dt: number, t: number): void {
    const parts = runtime.avatar.userData['parts'] as
      | { head?: THREE.Object3D; body?: THREE.Object3D }
      | undefined;

    if (runtime.state === 'WALKING_TO_CEO' || runtime.state === 'RETURNING') {
      this.stepPath(runtime, dt);
      if (parts?.head && !this.reducedMotion) {
        parts.head.position.y = 1.18 + Math.sin(t * 10) * 0.025;
      }
      if (parts?.body && !this.reducedMotion) {
        parts.body.rotation.z = Math.sin(t * 8) * 0.04;
      }
      return;
    }

    if (!this.reducedMotion) {
      if (parts?.head) {
        parts.head.position.y = 1.18 + Math.sin(t * 2.4 + runtime.home.x) * 0.02;
      }
      if (parts?.body) {
        parts.body.rotation.y = Math.sin(t * 1.2 + runtime.home.z) * 0.05;
      }
      runtime.avatar.rotation.y = Math.sin(t * 0.7 + runtime.home.x) * 0.08;
    }

    if (runtime.state === 'WAITING_AT_CEO') {
      runtime.avatar.lookAt(CEO_POS.x + 2.5, 1.2, CEO_POS.z);
    } else if (runtime.state === 'SEATED') {
      runtime.avatar.rotation.y += (Math.PI - runtime.avatar.rotation.y) * 0.05;
    }
  }

  private stepPath(runtime: AgentRuntime, dt: number): void {
    if (runtime.path.length < 2) {
      const nextState: AvatarState = runtime.state === 'RETURNING' ? 'SEATED' : 'WAITING_AT_CEO';
      runtime.state = nextState;
      if (nextState === 'WAITING_AT_CEO') {
        this.onAgentArrivedAtDoor(runtime);
      }
      this.syncBubblesForAgent(runtime);
      return;
    }
    const from = runtime.path[runtime.pathIndex];
    const to = runtime.path[runtime.pathIndex + 1];
    if (!from || !to) {
      runtime.state = runtime.state === 'RETURNING' ? 'SEATED' : 'WAITING_AT_CEO';
      this.syncBubblesForAgent(runtime);
      return;
    }

    const dist = from.distanceTo(to);
    const speed = 1.8;
    const step = (dt * speed) / Math.max(dist, 0.001);
    const nextWalkT = runtime.walkT + step;

    if (
      runtime.state === 'WALKING_TO_CEO' &&
      this.isCeoDoorBlocking() &&
      segmentCrossesObstacle(
        { x: from.x, z: from.z },
        { x: to.x, z: to.z },
        { ...CEO_DOOR_OBSTACLE, active: true },
      )
    ) {
      runtime.avatar.position.copy(DOOR_HOLD_POS);
      runtime.path = [];
      runtime.walkT = 0;
      return;
    }

    runtime.walkT = nextWalkT;

    if (runtime.walkT >= 1) {
      runtime.avatar.position.copy(to);
      runtime.pathIndex += 1;
      runtime.walkT = 0;
      if (runtime.pathIndex >= runtime.path.length - 1) {
        const arrivingAtDoor = runtime.state !== 'RETURNING';
        const atHold =
          arrivingAtDoor &&
          this.isCeoDoorBlocking() &&
          to.distanceToSquared(DOOR_HOLD_POS) < 0.5;
        if (atHold) {
          runtime.path = [];
          return;
        }
        runtime.state = runtime.state === 'RETURNING' ? 'SEATED' : 'WAITING_AT_CEO';
        runtime.path = [];
        if (runtime.state === 'SEATED') {
          runtime.avatar.position.copy(runtime.home);
        } else if (arrivingAtDoor) {
          this.onAgentArrivedAtDoor(runtime);
        }
        this.syncBubblesForAgent(runtime);
      }
      return;
    }

    runtime.avatar.position.lerpVectors(from, to, runtime.walkT);
    const dir = to.clone().sub(from);
    if (dir.lengthSq() > 0.0001) {
      const ang = Math.atan2(dir.x, dir.z);
      runtime.avatar.rotation.y = ang;
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.dragMoved = false;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
  }

  private handlePointerMove(e: PointerEvent): void {
    if ((e.buttons & 1) === 1) {
      if (Math.abs(e.clientX - this.pointerDownX) + Math.abs(e.clientY - this.pointerDownY) > 6) {
        this.dragMoved = true;
        this.focusOrbitRadius = null;
        this.desiredCameraPos = null;
      }
      return;
    }
    this.updateHoverFromPointer(e.clientX, e.clientY);
  }

  private handlePointerUp(): void {
    // click handler uses dragMoved; OrbitControls owns the camera drag
  }

  private handleClick(e: MouseEvent): void {
    if (!this.renderer || !this.camera || !this.scene || !this.selectCb) return;
    if (this.dragMoved) return;

    const hit = this.pickInteractive(e.clientX, e.clientY);
    if (!hit) return;

    if (hit.kind === 'ceo') {
      if (this.ceoGroup) pulseObjectClick(this.ceoGroup, this.reducedMotion);
      this.selectedAgentId = null;
      this.selectedLibraryId = null;
      this.applySelectionVisuals();
      this.selectCb('ceo');
      return;
    }
    if (hit.kind === 'bell') {
      if (this.ceoDoorParts?.bellButton) {
        pulseObjectClick(this.ceoDoorParts.bellButton, this.reducedMotion);
      }
      if (this.ceoDoorParts) triggerBellPress(this.ceoDoorParts);
      this.bellRingUntil = performance.now() + 1800;
      this.approvalCb?.('bell-click');
      this.selectCb('bell');
      return;
    }
    if (hit.kind === 'agent' && hit.id) {
      const runtime = this.agents.find((a) => a.config.id === hit.id);
      if (runtime) {
        pulseObjectClick(runtime.desk, this.reducedMotion);
        pulseObjectClick(runtime.avatar, this.reducedMotion);
      }
      this.selectedAgentId = hit.id;
      this.selectedLibraryId = null;
      this.syncKeyboardIndexToSelection();
      this.applySelectionVisuals();
      this.focusAgent(hit.id);
      this.selectCb('agent', hit.id);
      return;
    }
    if (hit.kind === 'library' && hit.id) {
      const lib = this.libraries.find((l) => l.entity.id === hit.id);
      if (lib) pulseObjectClick(lib.group, this.reducedMotion);
      this.selectedLibraryId = hit.id;
      this.selectedAgentId = null;
      this.syncKeyboardIndexToSelection();
      this.applySelectionVisuals();
      this.focusLibrary(hit.id);
      this.selectCb('library', hit.id);
    }
  }

  /** Public entry for page-level keyboard forwarding. */
  navigateWithKey(key: string, e?: KeyboardEvent): void {
    const targets = this.focusableTargets();
    if (!targets.length) return;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      e?.preventDefault();
      this.keyboardFocusIndex = (this.keyboardFocusIndex + 1) % targets.length;
      this.activateKeyboardFocus(targets[this.keyboardFocusIndex]!, false);
      return;
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      e?.preventDefault();
      this.keyboardFocusIndex = (this.keyboardFocusIndex - 1 + targets.length) % targets.length;
      this.activateKeyboardFocus(targets[this.keyboardFocusIndex]!, false);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      e?.preventDefault();
      const current = targets[this.keyboardFocusIndex];
      if (current) this.activateKeyboardFocus(current, true);
    }
  }

  private focusableTargets(): Array<{ kind: 'agent' | 'library' | 'ceo' | 'bell'; id: string }> {
    const list: Array<{ kind: 'agent' | 'library' | 'ceo' | 'bell'; id: string }> = [
      { kind: 'ceo', id: 'ceo' },
      { kind: 'bell', id: 'bell' },
    ];
    for (const a of this.agents) {
      list.push({ kind: 'agent', id: a.config.id });
    }
    for (const lib of this.libraries) {
      list.push({ kind: 'library', id: lib.entity.id });
    }
    return list;
  }

  private activateKeyboardFocus(
    target: { kind: 'agent' | 'library' | 'ceo' | 'bell'; id: string },
    commit: boolean,
  ): void {
    if (target.kind === 'ceo' || target.kind === 'bell') {
      this.hoveredAgentId = null;
      this.hoveredLibraryId = null;
      this.selectedAgentId = null;
      this.selectedLibraryId = null;
      this.hoveredCeo = target.kind === 'ceo';
      this.bellHovered = target.kind === 'bell';
      if (this.ceoGroup) setEmissiveBoost(this.ceoGroup, this.hoveredCeo);
      this.applySelectionVisuals();
      this.focusCeo();
      this.focusCb?.(target.kind);
      if (commit && this.selectCb) this.selectCb(target.kind);
      return;
    }
    if (this.hoveredCeo && this.ceoGroup) {
      setEmissiveBoost(this.ceoGroup, false);
    }
    this.hoveredCeo = false;
    this.bellHovered = false;
    if (target.kind === 'agent') {
      this.hoveredAgentId = target.id;
      this.hoveredLibraryId = null;
      this.selectedAgentId = target.id;
      this.selectedLibraryId = null;
      this.applySelectionVisuals();
      this.focusAgent(target.id);
      this.focusCb?.('agent', target.id);
      if (commit && this.selectCb) this.selectCb('agent', target.id);
      return;
    }
    this.hoveredLibraryId = target.id;
    this.hoveredAgentId = null;
    this.selectedLibraryId = target.id;
    this.selectedAgentId = null;
    this.applySelectionVisuals();
    this.focusLibrary(target.id);
    this.focusCb?.('library', target.id);
    if (commit && this.selectCb) this.selectCb('library', target.id);
  }

  private syncKeyboardIndexToSelection(): void {
    const targets = this.focusableTargets();
    const idx = targets.findIndex((t) => {
      if (this.selectedAgentId && t.kind === 'agent' && t.id === this.selectedAgentId) return true;
      if (this.selectedLibraryId && t.kind === 'library' && t.id === this.selectedLibraryId) return true;
      return false;
    });
    if (idx >= 0) this.keyboardFocusIndex = idx;
  }

  private updateHoverFromPointer(clientX: number, clientY: number): void {
    if (!this.renderer) return;
    const hit = this.pickInteractive(clientX, clientY);
    let nextAgent: string | null = null;
    let nextLib: string | null = null;
    const nextCeo = hit?.kind === 'ceo';
    const nextBell = hit?.kind === 'bell';
    if (hit?.kind === 'agent') nextAgent = hit.id ?? null;
    if (hit?.kind === 'library') nextLib = hit.id ?? null;

    this.emitTooltip(hit, clientX, clientY);

    if (
      nextAgent === this.hoveredAgentId &&
      nextLib === this.hoveredLibraryId &&
      nextCeo === this.hoveredCeo &&
      nextBell === this.bellHovered
    ) {
      return;
    }

    this.hoveredAgentId = nextAgent;
    this.hoveredLibraryId = nextLib;
    this.bellHovered = nextBell;
    if (nextCeo !== this.hoveredCeo) {
      this.hoveredCeo = nextCeo;
      if (this.ceoGroup) setEmissiveBoost(this.ceoGroup, nextCeo);
    }
    this.applySelectionVisuals();
    this.renderer.domElement.style.cursor =
      nextAgent || nextLib || nextCeo || nextBell ? 'pointer' : 'default';
  }

  private emitTooltip(
    hit: { kind: 'agent' | 'library' | 'ceo' | 'bell'; id?: string } | null,
    clientX: number,
    clientY: number,
  ): void {
    if (!this.tooltipCb || !this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.emitTooltipHidden();
      return;
    }
    const ndcX = (clientX - rect.left) / rect.width;
    const ndcY = (clientY - rect.top) / rect.height;
    if (!hit) {
      this.tooltipCb({ kind: null, title: '', ndcX, ndcY, visible: false });
      return;
    }
    if (hit.kind === 'agent' && hit.id) {
      const runtime = this.agents.find((a) => a.config.id === hit.id);
      const name = runtime?.config.name || runtime?.config.code || hit.id;
      const visual = resolveAgentVisualStatus(runtime?.config.status ?? 'AVAILABLE');
      this.tooltipCb({
        kind: 'agent',
        title: name,
        subtitle: statusLabelFr(visual),
        ndcX,
        ndcY,
        visible: true,
      });
      return;
    }
    if (hit.kind === 'library' && hit.id) {
      const lib = this.libraries.find((l) => l.entity.id === hit.id);
      this.tooltipCb({
        kind: 'library',
        title: lib?.entity.label ?? hit.id,
        subtitle: 'Bientôt',
        ndcX,
        ndcY,
        visible: true,
      });
      return;
    }
    if (hit.kind === 'ceo') {
      this.tooltipCb({
        kind: 'ceo',
        title: this.ceoOptions.ownerLabel || 'Bureau CEO',
        subtitle: 'Bureau direction',
        ndcX,
        ndcY,
        visible: true,
      });
      return;
    }
    if (hit.kind === 'bell') {
      this.tooltipCb({
        kind: 'bell',
        title: 'Sonnette — validations',
        subtitle: 'Ouvrir les validations',
        ndcX,
        ndcY,
        visible: true,
      });
    }
  }

  private emitTooltipHidden(): void {
    this.tooltipCb?.({ kind: null, title: '', ndcX: 0, ndcY: 0, visible: false });
  }

  private pickInteractive(
    clientX: number,
    clientY: number,
  ): { kind: 'agent' | 'library' | 'ceo' | 'bell'; id?: string } | null {
    if (!this.renderer || !this.camera || !this.scene) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const targets: THREE.Object3D[] = [];
    for (const a of this.agents) {
      targets.push(a.focusRing, a.desk, a.avatar);
    }
    for (const lib of this.libraries) {
      targets.push(lib.group);
    }
    if (this.ceoGroup) targets.push(this.ceoGroup);
    if (this.ceoDoorParts?.bellButton) targets.push(this.ceoDoorParts.bellButton);

    const hits = this.raycaster.intersectObjects(targets, true);
    if (!hits.length) return null;

    let obj: THREE.Object3D | null = hits[0].object;
    while (obj) {
      if (obj.userData['type'] === 'ceo-bell') return { kind: 'bell' };
      if (obj.userData['type'] === 'ceo') return { kind: 'ceo' };
      if (obj.userData['type'] === 'library' && obj.userData['libraryId']) {
        return { kind: 'library', id: obj.userData['libraryId'] as string };
      }
      if (obj.userData['libraryId']) {
        return { kind: 'library', id: obj.userData['libraryId'] as string };
      }
      if (obj.userData['agentId']) {
        return { kind: 'agent', id: obj.userData['agentId'] as string };
      }
      obj = obj.parent;
    }
    return null;
  }

  private applySelectionVisuals(): void {
    for (const runtime of this.agents) {
      const state =
        runtime.config.id === this.selectedAgentId
          ? 'selected'
          : runtime.config.id === this.hoveredAgentId
            ? 'hover'
            : 'idle';
      const visual = resolveAgentVisualStatus(runtime.config.status);
      const activityBoost = visual === 'busy' || visual === 'validation';
      setFocusRingState(runtime.focusRing, state, this.clock.elapsedTime, {
        activityBoost,
        reducedMotion: this.reducedMotion,
      });
    }
    for (const lib of this.libraries) {
      const state =
        lib.entity.id === this.selectedLibraryId
          ? 'selected'
          : lib.entity.id === this.hoveredLibraryId
            ? 'hover'
            : 'idle';
      setLibraryVisualState(lib.group, state);
    }
  }

  private updateAgentRingAccent(runtime: AgentRuntime): void {
    const accent = accentForCode(runtime.config.code);
    const visual = resolveAgentVisualStatus(runtime.config.status);
    setFocusRingAccent(runtime.focusRing, blendHex(accent, STATUS_TINT[visual]));
  }

  private applyHomeFraming(preserveFocus = false): void {
    if (!this.camera || !this.scene) return;
    const framing = initializeRoomCamera(this.camera, this.scene, CAMERA_ROOM_PADDING);
    this.homeFraming = framing;
    this.minOrbitRadius = framing.minOrbitRadius;
    this.maxOrbitRadius = framing.maxOrbitRadius;
    applyFramingToCamera(this.camera, framing);

    if (this.controls) {
      this.controls.minDistance = framing.minOrbitRadius;
      this.controls.maxDistance = framing.maxOrbitRadius;
      this.controls.minPolarAngle = framing.minPolarAngle;
      this.controls.maxPolarAngle = framing.maxPolarAngle;
    }

    if (preserveFocus && this.focusOrbitRadius != null) {
      return;
    }

    this.focusOrbitRadius = null;
    this.desiredCameraPos = null;
    this.lookAtTarget.copy(framing.lookAt);
    this.lookAtCurrent.copy(framing.lookAt);
    this.orbitRadius = framing.orbitRadius;
    this.orbitHeight = framing.orbitHeight;
    this.yaw = framing.yaw;
    this.targetYaw = framing.yaw;
    this.camera.position.set(
      Math.sin(this.yaw) * this.orbitRadius + this.lookAtCurrent.x * 0.15,
      this.orbitHeight,
      Math.cos(this.yaw) * this.orbitRadius + this.lookAtCurrent.z * 0.15,
    );
    if (this.controls) {
      this.controls.target.copy(this.lookAtCurrent);
      this.controls.update();
    } else {
      this.camera.lookAt(this.lookAtCurrent);
    }
  }

  private onResize(): void {
    if (!this.renderer || !this.camera) return;
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.focusOrbitRadius == null) {
      this.applyHomeFraming(false);
    } else if (this.homeFraming) {
      applyFramingToCamera(this.camera, {
        ...this.homeFraming,
        fov: this.camera.fov,
      });
      const reframed = initializeRoomCamera(this.camera, this.scene!, CAMERA_ROOM_PADDING);
      this.homeFraming = reframed;
      this.minOrbitRadius = reframed.minOrbitRadius;
      this.maxOrbitRadius = reframed.maxOrbitRadius;
      applyFramingToCamera(this.camera, reframed);
      if (this.controls) {
        this.controls.minDistance = reframed.minOrbitRadius;
        this.controls.maxDistance = reframed.maxOrbitRadius;
        this.controls.minPolarAngle = reframed.minPolarAngle;
        this.controls.maxPolarAngle = reframed.maxPolarAngle;
        this.controls.update();
      }
    }
  }
}
