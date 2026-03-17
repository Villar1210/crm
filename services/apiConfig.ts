const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_API_URL;
  if (envBase) {
    return envBase;
  }
  return import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';
};

export const API_BASE_URL = resolveApiBase();
export const API_ROOT_URL = API_BASE_URL.replace(/\/api$/, '');
export const WHATSAPP_API_URL = `${API_BASE_URL}/whatsapp`;
