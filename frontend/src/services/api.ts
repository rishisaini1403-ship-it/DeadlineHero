import axios from 'axios';
import { ApiError } from '@/types/api.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log(API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      success: false,
      message: error.response?.data?.message || 'An unexpected error occurred',
      errors: error.response?.data?.errors,
    };

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(apiError);
  }
);

export default api;
