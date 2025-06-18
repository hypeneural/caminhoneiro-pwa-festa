import axios from 'axios';

const baseURL = import.meta.env.DEV 
  ? 'http://localhost:8080' // URL de desenvolvimento
  : 'https://api.festadocaminhoneiro.com.br'; // URL de produção

// Instância principal do axios
const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na requisição:', error);
    
    // Se for erro de rede ou CORS, tenta fazer a requisição direta
    if (error.code === 'ERR_NETWORK' && import.meta.env.DEV) {
      const fallbackUrl = 'https://s03.svrdedicado.org:6860/stats?json=1';
      
      return axios.get(fallbackUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;