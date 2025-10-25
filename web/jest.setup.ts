import '@testing-library/jest-dom';
import 'jest-environment-jsdom';

global.fetch = jest.fn();

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(body as string),
        text: async () => body as string,
        ...init,
      } as Response;
    }
  } as typeof Response;
}

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as Storage;
global.localStorage = localStorageMock;
