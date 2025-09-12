import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Hata yönetimi
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('API Request Error:', error.request);
      return Promise.reject({ message: 'Sunucudan yanıt alınamadı' });
    } else {
      console.error('API Setup Error:', error.message);
      return Promise.reject({ message: 'İstek kurulumunda hata oluştu' });
    }
  }
);

// Sadece katalog için gerekli API fonksiyonları
export const getCategories = () => API.get('/categories');
export const getItems = () => API.get('/items');
export const getItemsByCategory = (categoryName, subcategoryName = null) => {
  if (subcategoryName) {
    return API.get(`/items/${categoryName}/${subcategoryName}`);
  }
  return API.get(`/items/${categoryName}`);
};
export const getItemById = (id) => API.get(`/items/${id}`);
export const healthCheck = () => API.get('/health');