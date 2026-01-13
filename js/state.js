import { KNIVES } from './constants.js';

export const state = {};

export const appConfig = {
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
  lastBigKnifeFont: "Montserrat",
  storedPositions: { big: {}, small: {}, others: {} }
};

// Elements cache
export const elements = {
  pages: {
    1: document.getElementById('page-1'),
    2: document.getElementById('page-2'),
    3: document.getElementById('page-3'),
    4: document.getElementById('page-4'),
    5: document.getElementById('page-5')
  },
  productPicker: document.getElementById('product-picker'),
  bigKnifeContent: document.getElementById('big-knife-content'),
  smallKnifeContent: document.getElementById('small-knife-content'),
  previewContent: document.getElementById('preview-content'),
  otherContent: document.getElementById('other-content'),
  modal: document.getElementById('modal'),
  modalImage: document.getElementById('modal-image'),
  alertModal: document.getElementById('alert-modal'),
  alertMessage: document.getElementById('alert-message'),
  langToggle: document.getElementById('lang-toggle'),
  next1: document.getElementById('next-1'),
  back2: document.getElementById('back-2'),
  next2: document.getElementById('next-2'),
  back3: document.getElementById('back-3'),
  next3: document.getElementById('next-3'),
  back4: document.getElementById('back-4'),
  back5: document.getElementById('back-5'),
  next5: document.getElementById('next-5'),
  downloadAll: document.getElementById('download-all'),
  alertClose: document.getElementById('alert-close'),
  // Optional: Used only in language.js, but caching for consistency
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  // Additional from main.js (e.g., navigation and preview generation)
  generatePreview: document.getElementById('generate-preview'),
  // Toggles (add these if you want to cache them; update IDs if they don't match HTML)
  syncBig: document.getElementById('sync-big'),  // May need to change to 'auto-align' if that's the real ID
  syncSmall: document.getElementById('sync-small'),
  syncOthers: document.getElementById('sync-others'),
  showZone: document.getElementById('show-zone')  // May need to change to 'edit-zone'
};