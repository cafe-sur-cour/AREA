// lib/com-config.ts
export const getSocketUrl = () => {
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://backend:8080';
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    } else {
      return `http://${hostname}:8080`;
    }
  }
  if (process.env.NODE_ENV !== 'development') return 'http://backend:8080';
  return 'http://localhost:8080';
};

export const getAPIUrl = () => {
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://backend:8080/api';
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080/api';
    } else {
      return `http://${hostname}:8080/api`;
    }
  }
  if (process.env.NODE_ENV !== 'development') return 'http://backend:8080/api';
  return 'http://localhost:8080/api';
};

export const getFrontendUrl = () => {
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
};

export const getBackendUrl = () => {
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return 'http://backend:8080';
  } else {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    } else {
      return `http://${hostname}:8080`;
    }
  }
  if (process.env.NODE_ENV !== 'development') return 'http://backend:8080';
  return 'http://localhost:8080';
};
