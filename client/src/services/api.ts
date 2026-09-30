import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleMockRequest, isStandaloneDemo } from './mockBackend';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.hash) {
        if (!window.location.hash.includes('/login')) {
          window.location.hash = '#/login';
        }
      } else if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    if (isStandaloneDemo()) {
      const data = await handleMockRequest('get', url);
      return { data, status: 200, statusText: 'OK', headers: {}, config: config || {} } as AxiosResponse<T>;
    }
    try {
      return await axiosInstance.get<T>(url, config);
    } catch (err: any) {
      if (!err.response && typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        console.warn('Network unreachable on remote host, falling back to in-browser demo store');
        const data = await handleMockRequest('get', url);
        return { data, status: 200, statusText: 'OK', headers: {}, config: config || {} } as AxiosResponse<T>;
      }
      throw err;
    }
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    if (isStandaloneDemo()) {
      const resData = await handleMockRequest('post', url, data);
      return { data: resData, status: 200, statusText: 'OK', headers: {}, config: config || {} } as AxiosResponse<T>;
    }
    try {
      return await axiosInstance.post<T>(url, data, config);
    } catch (err: any) {
      if (!err.response && typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        console.warn('Network unreachable on remote host, falling back to in-browser demo store');
        const resData = await handleMockRequest('post', url, data);
        return { data: resData, status: 200, statusText: 'OK', headers: {}, config: config || {} } as AxiosResponse<T>;
      }
      throw err;
    }
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    if (isStandaloneDemo()) {
      const resData = await handleMockRequest('delete', url);
      return { data: resData, status: 200, statusText: 'OK', headers: {}, config: config || {} } as AxiosResponse<T>;
    }
    return axiosInstance.delete<T>(url, config);
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    if (isStandaloneDemo()) {
      const resData = await handleMockRequest('put', url, data);
      return { data: resData, status: 200, statusText: 'OK', headers: {}, config: config || {} } as AxiosResponse<T>;
    }
    return axiosInstance.put<T>(url, data, config);
  },
};

export default api;
