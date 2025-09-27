// lib/com-config.ts
import {getEnv} from '@/lib/load-env'

export const getSocketUrl = async () => {
const {backendPort} = await getEnv();
const {backendUrl} = await getEnv();
  if (process.env.DOCKER_ENV === 'true') {
    return backendUrl;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${backendPort}`;
    } else {
      return `http://${hostname}:${backendPort}`;
    }
  }
  if (process.env.NODE_ENV !== 'development') return 'http://backend:8080';
  return `http://localhost:${backendPort}`;
};

export const getAPIUrl = async () => {
  const {backendPort} = await getEnv();
  const {backendUrl} = await getEnv();
  if (process.env.DOCKER_ENV === 'true') {
    return `${backendUrl}/api`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${backendPort}/api`;
    } else {
      return `http://${hostname}:${backendPort}/api`;
    }
  }
  if (process.env.NODE_ENV !== 'development') return 'http://backend:8080/api';
  return `http://localhost:${backendPort}/api`;
};

export const getFrontendUrl = async () => {
  const {frontendUrl} = await getEnv();
  return frontendUrl || 'http://localhost:8081';
};

export const getBackendUrl = async () => {
  const {backendPort} = await getEnv();
  const {backendUrl} = await getEnv();
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return backendUrl;
  } else {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${backendPort}`;
    } else {
      return `http://${hostname}:${backendPort}`;
    }
  }
  if (process.env.NODE_ENV !== 'development') return backendUrl;
  return `http://localhost:${backendPort}`;
};
