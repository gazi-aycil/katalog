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

// Kategori fonksiyonları
export const getCategories = () => API.get('/categories');
export const getCategoryById = (id) => API.get(`/categories/${id}`);
export const createCategory = (category) => API.post('/categories', category);
export const updateCategory = (id, category) => API.put(`/categories/${id}`, category);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Ürün fonksiyonları
export const getItems = () => API.get('/items');
export const getItemById = (id) => API.get(`/items/${id}`);
export const createItem = (item) => API.post('/items', item);
export const updateItem = (id, itemData) => API.put(`/items/${id}`, itemData);
export const deleteItem = (id) => API.delete(`/items/${id}`);

// ID ile ürünleri getirme
export const getProductsByCategoryId = (categoryId, subcategoryId = null) => {
  const params = subcategoryId ? { subcategoryId } : {};
  return API.get(`/categories/${categoryId}/products`, { params });
};

// Admin fonksiyonları
export const updateProductReferences = () => API.post('/admin/update-product-references');

// Resim yükleme
export const uploadProductImages = (formData) => {
  return API.post('/upload-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Health check
export const healthCheck = () => API.get('/health');

export default API;