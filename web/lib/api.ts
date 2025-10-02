import { getAPIUrl } from './config';
import { getToken } from '@/lib/manageToken';

const getAuthHeaders = async (auth_token?: string): Promise<HeadersInit> => {
  let token: string | null;
  if (auth_token) token = auth_token;
  else token = (await getToken())?.value || null;
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
  const apiUrl = await getAPIUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  const authHeaders = await getAuthHeaders(token);

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
  data?: unknown,
  token?: string
): Promise<Response> => {
  return authenticatedFetch(
    endpoint,
    {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    },
    token
  );
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
    data?: unknown,
    token?: string
  ): Promise<{ data: T | null }> => {
    const response = await apiPost(endpoint, data, token);
    if (!response.ok) {
      // Try to read the error body (JSON) to include it in the thrown Error.
      let errBody: string;
      try {
        const parsed = await response.json();
        errBody = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch (_) {
        errBody = response.statusText || `Status ${response.status}`;
      }
      throw new Error(`API request failed: ${errBody}`);
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
      let errBody: string;
      try {
        const parsed = await response.json();
        errBody = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch (_) {
        errBody = response.statusText || `Status ${response.status}`;
      }
      throw new Error(`API request failed: ${errBody}`);
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
      const apiUrl = await getAPIUrl();
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${apiUrl}${endpoint}`;
      const token = await getToken();

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
