export type { SceneTheme, ScenePalette, AgentDeskConfig, AvatarState } from './types';
export { getPalette, accentForCode, AGENT_ACCENTS } from './theme-palette';
export { createCartoonAvatar } from './avatar.factory';
export { createAgentDesk, createCeoOffice } from './desk.factory';
export type { CeoOfficeOptions } from './desk.factory';
export { createCompanyLogoPlaque, createCompanyCarpet } from './branding.factory';
export { buildOfficeEnvironment } from './office-builder';
export { OfficeSceneManager } from './scene-manager';
export {
  CAMERA_ROOM_PADDING,
  fitCameraToRoom,
  initializeRoomCamera,
  computeRoomBounds,
} from './camera-framing';
export type { RoomCameraFraming } from './camera-framing';
export { createFocusRing, setFocusRingState, setFocusRingAccent, FOCUS_RING } from './focus-ring.factory';
export { createDataLibrary, setLibraryVisualState } from './library.factory';
export { createSpeechBubble, fadeBubbleIn, fadeBubbleOut, disposeSpeechBubble } from './ui/speech-bubble.factory';
export { createComicDialoguePair } from './ui/comic-dialogue.factory';
export type { ComicDialoguePair } from './ui/comic-dialogue.factory';
export {
  pulseObjectClick,
  setEmissiveBoost,
} from './interaction-feedback';
export type { SceneTooltipPayload, SceneTooltipKind } from './interaction-feedback';
export {
  resolveAgentVisualStatus,
  STATUS_TINT,
  blendHex,
  statusLabelFr,
} from './agent-status-visuals';
export type { AgentVisualStatus } from './agent-status-visuals';
export {
  presetToSceneTheme,
  applyPresetPalette,
  loadScenePreset,
  saveScenePreset,
  presetLabel,
} from './scene-presets';
export type { SceneVisualPreset } from './scene-presets';
export { DESK_BY_CODE, MEZZANINE_ASSISTANTS, CEO_STAFF, TOTEM_ANIMALS, STAIRS_OBSTACLE } from './layout';
export { OPEN_SPACE_CARPET, openSpaceCarpetBounds, isInsideOpenSpaceCarpet } from '../config/open-space-carpet';
export { NIHAO_ROW_LAYOUTS, buildNihaoOfficeLayout, CHIEF_PLATFORM, NIHAO_ROW_GRID } from '../config/row-layout';
export { ROW_COLORS } from '../config/colors';
export { KEY_POSITIONS } from '../config/roles';
export { createAgentRowDesks, createChiefDesk } from './agent-row.factory';
export { createChiefPlatform } from './row-platform.factory';
export { createLedPair, setLedMode, pulseLeds } from './led.factory';
export { createTotemAnimal } from './totem.factory';
export { createMezzanine } from './mezzanine.factory';
