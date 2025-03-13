import { UserResponse } from '../types.js';
import { request as apiRequest } from './client.js';

export const fetchUser = async (
  apiKey: string,
  version = 'v1'
): Promise<UserResponse> => {
  const response = await apiRequest<UserResponse>("account", apiKey, version);
  return response;
};
