// Mock web worker globals
globalThis.self = globalThis as any;
globalThis.OffscreenCanvas = class OffscreenCanvas {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  getContext() {
    return {
      drawImage: () => {}
    }
  }
  convertToBlob() {
    return Promise.resolve(new Blob(['mock-blob-data']));
  }
} as any;
globalThis.createImageBitmap = () => Promise.resolve({ width: 100, height: 100 } as any);
globalThis.self.addEventListener = () => {}; globalThis.self.postMessage = () => {};
