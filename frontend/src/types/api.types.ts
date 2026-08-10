export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  errors?: string[];
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: string[];
  stack?: string;
}
