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
    if (config.data) {
      console.log('🟡 Request Data:', config.data);
    }
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

// Kategori işlemleri
export const createCategory = (category) => API.post('/categories', category);
export const getCategories = () => API.get('/categories');
export const getCategoryById = (id) => API.get(`/categories/${id}`);
export const updateCategory = (id, category) => API.put(`/categories/${id}`, category);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Ürün işlemleri
export const createItem = (item) => {
  console.log('🟡 createItem çağrıldı:', item);
  return API.post('/items', item);
};

export const getItems = () => API.get('/items');
export const getItemById = (id) => API.get(`/items/${id}`);
export const updateItem = (id, itemData) => {
  console.log('🟡 updateItem çağrıldı:', { id, itemData });
  return API.put(`/items/${id}`, itemData);
};
export const deleteItem = (id) => API.delete(`/items/${id}`);

// Kategoriye göre ürün getirme
export const getItemsByCategory = (categoryName, subcategoryName) => 
  API.get(`/items/${categoryName}/${subcategoryName || ''}`);

// ID ile kategoriye göre ürün getirme
export const getProductsByCategoryId = (categoryId, subcategoryId = null) => {
  const params = subcategoryId ? { subcategoryId } : {};
  return API.get(`/categories/${categoryId}/products`, { params });
};

// Resim yükleme işlemleri
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

// Özellikler (Features) API'leri
export const getFeatures = () => API.get('/features');
export const getFeatureById = (id) => API.get(`/features/${id}`);
export const createFeature = (featureData) => API.post('/features', featureData);
export const updateFeature = (id, featureData) => API.put(`/features/${id}`, featureData);
export const deleteFeature = (id) => API.delete(`/features/${id}`);

// Ürün özellik yönetimi
export const getProductFeatures = (productId) => API.get(`/products/${productId}/features`);
export const addProductFeature = (productId, featureData) => API.post(`/products/${productId}/features`, featureData);
export const updateProductFeature = (productId, featureId, featureData) => API.put(`/products/${productId}/features/${featureId}`, featureData);
export const removeProductFeature = (productId, featureId) => API.delete(`/products/${productId}/features/${featureId}`);

// Toplu ürün işlemleri
export const bulkCreateProducts = (productsData) => API.post('/products/bulk', productsData);
export const bulkUpdateProducts = (productsData) => API.put('/products/bulk', productsData);

// Arama ve filtreleme
export const searchProducts = (searchTerm, filters = {}) => {
  return API.get('/products/search', {
    params: {
      q: searchTerm,
      ...filters
    }
  });
};

export const filterProductsByFeatures = (filters) => {
  return API.post('/products/filter', filters);
};

// Kategori-özellik ilişkileri
export const getCategoryFeatures = (categoryId) => API.get(`/categories/${categoryId}/features`);
export const assignFeatureToCategory = (categoryId, featureId) => API.post(`/categories/${categoryId}/features/${featureId}`);
export const removeFeatureFromCategory = (categoryId, featureId) => API.delete(`/categories/${categoryId}/features/${featureId}`);

// Debug fonksiyonları
export const debugCategory = (categoryId) => API.get(`/debug/category/${categoryId}`);
export const debugCategoriesWithIds = () => API.get('/debug/categories-with-ids');
export const debugCategories = () => API.get('/debug/categories');
export const debugItems = () => API.get('/debug/items');
export const debugFeatures = () => API.get('/debug/features');

// Admin fonksiyonları
export const updateProductReferences = () => API.post('/admin/update-product-references');
export const syncFeaturesWithProducts = () => API.post('/admin/sync-features');
export const rebuildSearchIndex = () => API.post('/admin/rebuild-search-index');

// Sistem istatistikleri
export const getSystemStats = () => API.get('/admin/stats');
export const getFeatureStats = () => API.get('/admin/feature-stats');

// Health check
export const healthCheck = () => API.get('/health');

// Backup ve restore
export const createBackup = () => API.get('/admin/backup', { responseType: 'blob' });
export const restoreBackup = (formData) => {
  return API.post('/admin/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000
  });
};

export default API;