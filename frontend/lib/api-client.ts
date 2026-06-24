import { getAccessToken, setAccessToken } from './auth';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(public status: number, public error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      console.error(`Network Error calling ${path}:`, networkError);
      throw new ApiClientError(503, { code: 'NETWORK_ERROR', message: 'Failed to connect to the server. Please check if the backend is running.' });
    }

    if (res.status === 401 && token) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getAccessToken()}`;
        const retryRes = await fetch(`${baseUrl}${path}`, {
          method,
          headers,
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!retryRes.ok) {
          const errorData = await retryRes.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }));
          throw new ApiClientError(retryRes.status, errorData.error);
        }
        return retryRes.json();
      }
      const errorData = await res.json().catch(() => ({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }));
      throw new ApiClientError(res.status, errorData.error);
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }));
      throw new ApiClientError(res.status, errorData.error);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      setAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient();
