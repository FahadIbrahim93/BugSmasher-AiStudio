import { vi, beforeEach } from 'vitest';

// Mock Canvas prototype to avoid jsdom's "not implemented" warnings during unit tests
if (typeof window !== 'undefined') {
  const mockContext2D = {
    canvas: null,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0, height: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 })),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    rect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(),
    drawImage: vi.fn(),
    createImageData: vi.fn(() => ({})),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
  };

  Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn((type) => {
      if (type === '2d') {
        return mockContext2D;
      }
      return null;
    }),
    writable: true,
    configurable: true,
  });
}

// Intercept console.warn and console.error to filter out known/expected warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

const IGNORED_WARNINGS = [
  'IndexedDB not supported or permission denied',
  'IDB write failed',
  'IDB read failed',
  'IDB getAll failed',
  'IDB delete failed',
  'localStorage write failed',
  'localStorage backup write failed',
  'localStorage backup update failed',
  'localStorage read failed',
  'localStorage is blocked',
  'Failed to parse local high scores',
  'Could not synchronize Progression',
  'Could not synchronize Story',
  'Cloud saving not ready',
  'Save data integrity check failed',
  'Save data lacks a checksum',
  'Firestore Error',
  'Profile listen error',
  'Offline',
  'not configured to support act'
];

console.warn = (...args) => {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg instanceof Error ? arg.message : JSON.stringify(arg))).join(' ');
  if (IGNORED_WARNINGS.some(warn => msg.includes(warn))) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg instanceof Error ? arg.message : JSON.stringify(arg))).join(' ');
  if (IGNORED_WARNINGS.some(warn => msg.includes(warn))) {
    return;
  }
  originalError(...args);
};

// Mock Firebase modules globally
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((cb) => {
      cb(null);
      return vi.fn();
    }),
  },
  db: {},
  googleProvider: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() => ({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
  collection: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  serverTimestamp: vi.fn(() => new Date()),
  increment: vi.fn((n) => n),
}));

beforeEach(() => {
  localStorage.clear();
});

