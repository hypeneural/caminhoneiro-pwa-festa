import axios from 'axios';
import { API } from '@/constants/api';

const api = axios.create({
  baseURL: API.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Configurações para lidar com CORS
  withCredentials: false
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    // Erros específicos da API
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.error('Erro de autenticação');
          break;
        case 403:
          console.error('Acesso não autorizado');
          break;
        case 404:
          console.error('Recurso não encontrado');
          break;
        case 429:
          console.error('Muitas requisições');
          break;
        case 500:
          console.error('Erro interno do servidor');
          break;
        default:
          console.error(`Erro na requisição: ${error.message}`);
      }
    } 
    // Erros de rede/timeout
    else if (error.request) {
      console.error('Erro de rede:', error.message);
    } 
    // Outros erros
    else {
      console.error('Erro:', error.message);
    }

    return Promise.reject(error);
  }
);

// Interceptor para adicionar headers comuns
api.interceptors.request.use(
  config => {
    // Remove headers problemáticos
    delete config.headers['Cache-Control'];
    delete config.headers['Pragma'];
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;
