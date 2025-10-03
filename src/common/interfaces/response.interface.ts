export interface IResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
  statusCode: number;
}

export interface IPaginatedResponse<T = any> extends IResponse<T[]> {
  meta: IPaginationMeta;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
  errors?: string[];
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ITokenPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}