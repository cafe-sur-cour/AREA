import { getAPIUrl } from './config';

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie =>
      cookie.trim().startsWith('authToken=')
    );
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
    return null;
  }
  return null;
};

const getAuthHeaders = (authToken?: string): HeadersInit => {
  let token: string | null;
  if (authToken) token = authToken;
  else token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> => {
  const apiUrl = getAPIUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  const authHeaders = getAuthHeaders(token);

  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
  return fetch(url, config);
};

export const apiGet = async (
  endpoint: string,
  token?: string,
  data?: unknown
): Promise<Response> => {
  return authenticatedFetch(
    endpoint,
    { method: 'GET', body: data ? JSON.stringify(data) : undefined },
    token
  );
};

export const apiPost = async (
  endpoint: string,
  data?: unknown
): Promise<Response> => {
  return authenticatedFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiPut = async (
  endpoint: string,
  data?: unknown
): Promise<Response> => {
  return authenticatedFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiPatch = async (
  endpoint: string,
  data?: unknown
): Promise<Response> => {
  return authenticatedFetch(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiDelete = async (endpoint: string): Promise<Response> => {
  return authenticatedFetch(endpoint, { method: 'DELETE' });
};

export const api = {
  get: async <T = unknown>({
    endpoint,
    data,
    token,
  }: {
    endpoint: string;
    data?: unknown;
    token?: string;
  }): Promise<{ data: T | null }> => {
    try {
      const response = await apiGet(endpoint, token, data);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const json = await response.json();
      return { data: json };
    } catch (error) {
      console.error(error);
      return { data: null };
    }
  },

  post: async <T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<{ data: T | null }> => {
    const response = await apiPost(endpoint, data);
    if (!response.ok) {
      throw new Error(`${response.json()}`);
    }
    try {
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      console.error(error);
      return { data: null as T | null };
    }
  },

  put: async <T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<{ data: T | null }> => {
    const response = await apiPut(endpoint, data);
    if (!response.ok) {
      throw new Error(`${response.json()}`);
    }
    try {
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      console.error(error);
      return { data: null as T | null };
    }
  },

  delete: async <T = unknown>(
    endpoint: string
  ): Promise<{ data: T | null }> => {
    const response = await apiDelete(endpoint);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    try {
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      console.error(error);
      return { data: null as T | null };
    }
  },

  patch: async <T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<{ data: T | null }> => {
    const response = await apiPatch(endpoint, data);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    try {
      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      console.error(error);
      return { data: null as T | null };
    }
  },

  postFormData: async <T = unknown>(
    endpoint: string,
    formData: FormData
  ): Promise<T> => {
    try {
      const apiUrl = getAPIUrl();
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${apiUrl}${endpoint}`;
      const token = getToken();

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
};

export default api;
