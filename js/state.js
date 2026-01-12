/* js/state.js */
import { CONSTANTS } from './config.js';

// The main state object holding canvas data for each knife
export const canvasState = {}; 

// Global application settings
export const appState = {
  currentLang: 'en',
  sameContent: true,
  sharedText: '',
  firstSelectedKnife: null,
  lastAdjusted: { big: null, small: null, others: null },
  syncFonts: true,
  showEditZone: true,
  showResizeControls: true,
  alignRightBig: true,
  alignRightSmall: true,
  alignRightOthers: false,
  isNavigating: false,
  lastToggleTime: 0,
  lastBigKnifeFont: CONSTANTS.DEFAULT_FONT_EN,
  storedPositions: { big: {}, small: {}, others: {} }
};

export function resetCanvasState() {
  Object.keys(canvasState).forEach(key => delete canvasState[key]);
}

export function initializeCanvasStateForKnife(knife) {
  canvasState[knife] = {
    img: null,
    overlay: null,
    baseFont: 100, // Will be overwritten based on knife type
    textScale: 1,
    baseDims: { w: 0, h: 0 },
    textRightX: 0,
    pos: { y: 0 },
    boxVisible: appState.showResizeControls,
    dragging: false,
    dragStart: {},
    resizing: false,
    resizeStart: {},
    pointers: {},
    pinch: false,
    pinchStart: {},
    // DOM Elements (populated later)
    view: null,
    vCtx: null,
    full: null,
    fCtx: null,
    wrapper: null,
    overlayEl: null,
    bbox: null,
    textInput: null,
    fontSel: null,
    weightSel: null,
    sameContentChk: null,
    // Caching
    cacheCanvas: null,
    cacheCtx: null,
    textCacheCanvas: null,
    textCacheCtx: null,
    previewCanvas: null,
    cacheValid: false,
    textCacheValid: false,
    pendingDraw: false
  };
}