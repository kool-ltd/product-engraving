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
  alertMessage: document.getElementById('alert-message')
};