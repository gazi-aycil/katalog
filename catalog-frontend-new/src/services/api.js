import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002/api',
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  headers: {
    'Content-Type': 'application/json',
    // Add any auth headers if needed
    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Add response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('API Request Error:', error.request);
      return Promise.reject({ message: 'No response received from server' });
    } else {
      console.error('API Setup Error:', error.message);
      return Promise.reject({ message: 'Error setting up request' });
    }
  }
);

export const createCategory = (category) => API.post('/categories', category);
export const createItem = (item) => API.post('/items', item);
export const getCategories = () => API.get('/categories');
export const updateCategory = (id, category) => API.put(`/categories/${id}`, category);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

export const getItems = () => API.get('/items');
export const updateItem = (id, itemData) => API.put(`/items/${id}`, itemData);
export const deleteItem = (id) => API.delete(`/items/${id}`);

export const getItemsByCategory = (categoryName, subcategoryName) => 
  API.get(`/items/${categoryName}/${subcategoryName || ''}`);

export const uploadProductImages = (formData) => {
  return axios.post('/api/upload-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};