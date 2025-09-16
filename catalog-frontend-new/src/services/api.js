import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://katalog-2uel.onrender.com/api',
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  timeout: 30000, // 30 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    console.log(`🟡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('🔴 API Response Error:', error);
    
    if (error.response) {
      console.error('🔴 Response Data:', error.response.data);
      console.error('🔴 Response Status:', error.response.status);
      console.error('🔴 Response Headers:', error.response.headers);
      
      return Promise.reject({
        message: error.response.data?.message || 'Sunucu hatası',
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('🔴 No Response Received:', error.request);
      return Promise.reject({ 
        message: 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.' 
      });
    } else {
      console.error('🔴 Request Setup Error:', error.message);
      return Promise.reject({ 
        message: 'İstek oluşturulurken hata oluştu: ' + error.message 
      });
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

export const uploadImages = (formData) => {
  return API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadImage = (formData) => {
  return API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadProductImages = (formData) => {
  return API.post('/upload-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 60 saniye
  });
};

// Excel import/export fonksiyonları
export const exportProductsTemplate = () => {
  return API.get('/export/products-template', {
    responseType: 'blob',
    timeout: 30000
  });
};

export const importProductsExcel = (formData) => {
  return API.post('/import/products-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000 // 2 dakika
  });
};

export const exportProducts = () => {
  return API.get('/export/products', {
    responseType: 'blob',
    timeout: 30000
  });
};

// Health check
export const healthCheck = () => API.get('/health');