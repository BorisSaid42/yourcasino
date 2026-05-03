import axios from 'axios';
import qs from 'qs';
import { getCredentials, updateCredentials } from './credentials';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
});

api.interceptors.request.use((config) => {
  const credentials = getCredentials();
  if (credentials) {
    config.headers.set('Authorization', `Bearer ${credentials}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 418) {
      const prevMaintenanceFlag = localStorage.getItem('__yourcasino.maintenance');
      localStorage.setItem('__yourcasino.maintenance', '1');

      if (prevMaintenanceFlag !== '1') {
        location.replace('/maintenance');
      }
    }

    if (error.response?.status === 403 && error.response.headers['cf-mitigated'] === 'challenge') {
      location.reload();
      return;
    }

    if (error.response?.status === 403) {
      updateCredentials(null);
    }

    throw error;
  },
);
