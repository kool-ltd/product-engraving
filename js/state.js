/* STATE & CONSTANTS */
const knives = {
  big: ['santoku', 'chef', 'bread'],
  small: ['utility', 'paring'],
  others: ['chopper', 'choppingBoard', 'tongs', 'scissors','turner']
};

const state = {};
let currentLang = 'en';
let sameContent = true;
let sharedText = '';
let firstSelectedKnife = null;
let lastAdjusted = { big: null, small: null, others: null };
let syncFonts = true;
let showEditZone = true;
let showResizeControls = true;
let alignRightBig = true;
let alignRightSmall = true;
let alignRightOthers = false;
let isNavigating = false;
let lastToggleTime = 0;
let lastBigKnifeFont = currentLang === 'zh-hk' ? "'中文預設',sans-serif" : "'Default',sans-serif";
let storedPositions = { big: {}, small: {}, others: {} };
const toggleDebounce = 200; // ms

/* DOM ELEMENTS */
const pages = {
  1: document.getElementById('page-1'),
  2: document.getElementById('page-2'),
  3: document.getElementById('page-3'),
  4: document.getElementById('page-4'),
  5: document.getElementById('page-5')
};
const productPicker = document.getElementById('product-picker');
const bigKnifeContent = document.getElementById('big-knife-content');
const smallKnifeContent = document.getElementById('small-knife-content');
const previewContent = document.getElementById('preview-content');
const otherContent = document.getElementById('other-content');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
