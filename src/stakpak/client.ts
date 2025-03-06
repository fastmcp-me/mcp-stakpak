const API_BASE_URL = 'https://apiv2.stakpak.dev';

export const request = async <T>(
  endpoint: string,
  apiKey: string,
  version = 'v1',
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}/${version}/${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Network error occurred');
  }
};
