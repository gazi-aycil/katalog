import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://katalog-2uel.onrender.com';

// API instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('🔴 API Response Error:', error);
    return Promise.reject(error);
  }
);

// GÜNCELLENMİŞ ÜRÜN GETİRME FONKSİYONLARI
export const getProductsByCategory = async (categoryId, includeSubcategories = true) => {
  try {
    const url = `/api/products/by-category/${categoryId}?includeSubcategories=${includeSubcategories}`;
    console.log('🟡 Kategori Ürünleri API İsteği:', url);
    const response = await api.get(url);
    console.log('🟢 Kategori Ürünleri API Yanıtı:', {
      category: response.data.category,
      productCount: response.data.products?.length || 0,
      totalProducts: response.data.totalProducts || 0
    });
    return response;
  } catch (error) {
    console.error('🔴 Kategori Ürünleri API Hatası:', error);
    throw error;
  }
};

export const getProductsBySubcategory = async (subcategoryId, includeSubcategories = true) => {
  try {
    const url = `/api/products/by-subcategory/${subcategoryId}?includeSubcategories=${includeSubcategories}`;
    console.log('🟡 Alt Kategori Ürünleri API İsteği:', url);
    const response = await api.get(url);
    console.log('🟢 Alt Kategori Ürünleri API Yanıtı:', {
      subcategory: response.data.subcategory,
      productCount: response.data.products?.length || 0,
      totalProducts: response.data.totalProducts || 0
    });
    return response;
  } catch (error) {
    console.error('🔴 Alt Kategori Ürünleri API Hatası:', error);
    throw error;
  }
};

// KATEGORİ GETİRME FONKSİYONU - DÜZELTİLMİŞ
export const getCategories = async () => {
  try {
    console.log('🟡 Kategoriler API isteği gönderiliyor...');
    const response = await api.get('/api/categories');
    console.log('🟢 Kategoriler API yanıtı:', {
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  } catch (error) {
    console.error('🔴 Kategoriler getirilirken hata:', error);
    throw error;
  }
};

// GERİYE UYUMLULUK FONKSİYONU
export const getProductsByCategoryId = async (categoryId, subcategoryId = null) => {
  if (subcategoryId) {
    return getProductsBySubcategory(subcategoryId, true);
  } else {
    return getProductsByCategory(categoryId, true);
  }
};

// DİĞER MEVCUT FONKSİYONLAR
export const getItemById = async (itemId) => {
  try {
    const response = await api.get(`/api/items/${itemId}`);
    return response;
  } catch (error) {
    console.error('Ürün detayları getirilirken hata:', error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  try {
    const response = await api.post('/api/items', itemData);
    return response;
  } catch (error) {
    console.error('Ürün oluşturulurken hata:', error);
    throw error;
  }
};

export const updateItem = async (itemId, itemData) => {
  try {
    const response = await api.put(`/api/items/${itemId}`, itemData);
    return response;
  } catch (error) {
    console.error('Ürün güncellenirken hata:', error);
    throw error;
  }
};

export const deleteItem = async (itemId) => {
  try {
    const response = await api.delete(`/api/items/${itemId}`);
    return response;
  } catch (error) {
    console.error('Ürün silinirken hata:', error);
    throw error;
  }
};

export const uploadImages = async (formData) => {
  try {
    const response = await api.post('/api/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Resim yüklenirken hata:', error);
    throw error;
  }
};

export const uploadCategoryImage = async (formData) => {
  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Kategori resmi yüklenirken hata:', error);
    throw error;
  }
};

export default api;