import axios, { AxiosInstance, AxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.0.180:5010';

interface ApiError {
  message: string;
  status?: number;
  isOffline: boolean;
  originalError?: AxiosError;
}

export class ApiClient {
  private client: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Monitor connectivity
    this.initConnectivityMonitor();
  }

  private initConnectivityMonitor(): void {
    NetInfo.addEventListener((state) => {
      this.isOnline = !!state.isConnected;
      console.log('[API] Network state:', { isConnected: state.isConnected });
    });
  }

  private handleError(error: AxiosError): ApiError {
    if (!this.isOnline || error.message === 'Network Error') {
      return {
        message: 'No internet connection. Please check your connection and try again.',
        isOffline: true,
        originalError: error,
      };
    }

    if (error.response) {
      return {
        message:
          (error.response.data as any)?.message ||
          `Server error: ${error.response.status}`,
        status: error.response.status,
        isOffline: false,
        originalError: error,
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
      isOffline: false,
      originalError: error,
    };
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }
}

/**
 * Api client.
 */
export const apiClient = new ApiClient();
export type { ApiError };
