import '@testing-library/jest-dom/vitest';

// Mock scrollIntoView — não disponível no jsdom (Radix UI Select usa internamente)
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mock matchMedia — não disponível no jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
