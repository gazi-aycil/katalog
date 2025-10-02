import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// GÜNCELLENMİŞ ÜRÜN GETİRME FONKSİYONLARI
export const getProductsByCategory = async (categoryId, includeSubcategories = true) => {
  try {
    const url = `${API_BASE_URL}/api/products/by-category/${categoryId}?includeSubcategories=${includeSubcategories}`;
    console.log('🟡 Kategori Ürünleri API İsteği:', url);
    const response = await axios.get(url);
    console.log('🟢 Kategori Ürünleri API Yanıtı:', {
      category: response.data.category,
      productCount: response.data.products.length,
      totalProducts: response.data.totalProducts
    });
    return response;
  } catch (error) {
    console.error('🔴 Kategori Ürünleri API Hatası:', error);
    throw error;
  }
};

export const getProductsBySubcategory = async (subcategoryId, includeSubcategories = true) => {
  try {
    const url = `${API_BASE_URL}/api/products/by-subcategory/${subcategoryId}?includeSubcategories=${includeSubcategories}`;
    console.log('🟡 Alt Kategori Ürünleri API İsteği:', url);
    const response = await axios.get(url);
    console.log('🟢 Alt Kategori Ürünleri API Yanıtı:', {
      subcategory: response.data.subcategory,
      productCount: response.data.products.length,
      totalProducts: response.data.totalProducts
    });
    return response;
  } catch (error) {
    console.error('🔴 Alt Kategori Ürünleri API Hatası:', error);
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
export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/categories`);
    return response;
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    throw error;
  }
};

export const getItemById = async (itemId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`);
    return response;
  } catch (error) {
    console.error('Ürün detayları getirilirken hata:', error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/items`, itemData);
    return response;
  } catch (error) {
    console.error('Ürün oluşturulurken hata:', error);
    throw error;
  }
};

export const updateItem = async (itemId, itemData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/items/${itemId}`, itemData);
    return response;
  } catch (error) {
    console.error('Ürün güncellenirken hata:', error);
    throw error;
  }
};

export const deleteItem = async (itemId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/items/${itemId}`);
    return response;
  } catch (error) {
    console.error('Ürün silinirken hata:', error);
    throw error;
  }
};

export const uploadImages = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/upload-images`, formData, {
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
    const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
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