const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const ImageKit = require('imagekit');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5002;

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: 'public_UjYJw52KefpFNDwLgSX84uFPlnw=',
  privateKey: 'private_Ah0UG/lM0+LaTvdurbXhnUy2ePk=',
  urlEndpoint: 'https://ik.imagekit.io/4t0zibpdh/'
});

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Upload dirs
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Excel upload config
const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const originalname = file.originalname.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    cb(null, Date.now() + '-' + originalname);
  }
});

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: function (req, file, cb) {
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    const mimetype = mimetypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları yükleyebilirsiniz (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dosya boyutu çok büyük (max 20MB)' });
    }
  }
  next(error);
});

// MongoDB
mongoose.connect('mongodb+srv://catalog-app:vlVAbyhQsAh2lUgS@catalog-app.v0tfl.mongodb.net/ravinzo?retryWrites=true&w=majority&appName=catalog-app&', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  console.log('Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// SCHEMAS - Tüm seviyelere ID desteği
const subcategorySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  name: { type: String, required: true },
  imageUrl: String,
  subcategories: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: false, _id: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: String,
  subcategories: { type: [subcategorySchema], default: [] }
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: String,
  subcategoryId: { type: mongoose.Schema.Types.ObjectId },
  price: { type: mongoose.Schema.Types.Mixed, required: true },
  specs: [String],
  images: [String],
}, { timestamps: true });

// Features Schema
const featureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    required: true,
    enum: ['usage_area', 'product_measurements', 'product_properties']
  },
  hasValue: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

featureSchema.index({ name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
const Item = mongoose.model('Item', itemSchema);
const Feature = mongoose.model('Feature', featureSchema);

itemSchema.index({ category: 1, subcategory: 1 });
itemSchema.index({ categoryId: 1, subcategoryId: 1 });
categorySchema.index({ name: 1 });

// HELPERS - Tüm seviyelerde ObjectId formatında ID desteği
function findSubcategoryById(categoryDoc, subcategoryId) {
  if (!subcategoryId) return null;
  
  // Gelen ID'yi string formatına çevir
  let searchId;
  if (typeof subcategoryId === 'string') {
    searchId = subcategoryId;
  } else if (subcategoryId instanceof mongoose.Types.ObjectId) {
    searchId = subcategoryId.toString();
  } else {
    searchId = subcategoryId.toString();
  }
  
  function searchRecursive(nodes) {
    if (!Array.isArray(nodes)) return null;
    
    for (const node of nodes) {
      if (!node) continue;
      
      // ID kontrolü - node._id ObjectId olabilir
      if (node._id) {
        const nodeIdStr = node._id.toString();
        if (nodeIdStr === searchId) {
          return node;
        }
      }
      
      // Alt kategorilerde recursive arama
      if (node.subcategories && node.subcategories.length > 0) {
        const found = searchRecursive(node.subcategories);
        if (found) return found;
      }
    }
    return null;
  }
  
  return searchRecursive(categoryDoc.subcategories);
}

function findAllSubcategories(categoryDoc) {
  const allSubcategories = [];
  
  function collectRecursive(nodes) {
    if (!Array.isArray(nodes)) return;
    
    for (const node of nodes) {
      if (!node) continue;
      
      // Mevcut node'u ekle
      allSubcategories.push(node);
      
      // Alt kategorileri recursive topla
      if (node.subcategories && node.subcategories.length > 0) {
        collectRecursive(node.subcategories);
      }
    }
  }
  
  collectRecursive(categoryDoc.subcategories);
  return allSubcategories;
}

function removeSubcategoryById(categoryDoc, subcategoryId) {
  if (!subcategoryId) return false;
  
  // Gelen ID'yi string formatına çevir
  let searchId;
  if (typeof subcategoryId === 'string') {
    searchId = subcategoryId;
  } else {
    searchId = subcategoryId.toString();
  }

  function recurse(arr) {
    if (!Array.isArray(arr)) return false;
    
    for (let i = 0; i < arr.length; i++) {
      const node = arr[i];
      if (!node) continue;
      
      if (node._id && node._id.toString() === searchId) {
        arr.splice(i, 1);
        return true;
      }
      
      if (node.subcategories && node.subcategories.length) {
        const removed = recurse(node.subcategories);
        if (removed) return true;
      }
    }
    return false;
  }
  
  return recurse(categoryDoc.subcategories);
}

// YARDIMCI: Tüm subcategory'lere ObjectId formatında ID ata (yoksa)
function ensureSubcategoryIds(categoryData) {
  if (!categoryData.subcategories) return categoryData;
  
  function addIdsRecursive(subcategories) {
    return subcategories.map(subcat => {
      // Eğer _id string olarak geliyorsa ObjectId'ye çevir, yoksa yeni oluştur
      let subcatId;
      if (subcat._id) {
        if (typeof subcat._id === 'string') {
          subcatId = new mongoose.Types.ObjectId(subcat._id);
        } else {
          subcatId = subcat._id;
        }
      } else {
        subcatId = new mongoose.Types.ObjectId();
      }
      
      return {
        _id: subcatId,
        name: subcat.name,
        imageUrl: subcat.imageUrl,
        subcategories: subcat.subcategories ? addIdsRecursive(subcat.subcategories) : []
      };
    });
  }
  
  return {
    ...categoryData,
    subcategories: addIdsRecursive(categoryData.subcategories)
  };
}

// YARDIMCI: Herhangi bir seviyedeki kategoriyi ID ile bul
function findCategoryById(categories, targetId) {
  if (!targetId) return null;
  
  const searchId = typeof targetId === 'string' ? targetId : targetId.toString();
  
  function searchRecursive(cats) {
    for (const cat of cats) {
      if (!cat) continue;
      
      // Mevcut kategoriyi kontrol et
      if (cat._id && cat._id.toString() === searchId) {
        return cat;
      }
      
      // Alt kategorilerde ara
      if (cat.subcategories && cat.subcategories.length > 0) {
        const found = searchRecursive(cat.subcategories);
        if (found) return found;
      }
    }
    return null;
  }
  
  return searchRecursive(categories);
}

// YARDIMCI: Tüm alt kategorilerin ID'lerini topla (GÜNCELLENMİŞ)
function getAllSubcategoryIds(category) {
  const allIds = [];
  
  function collectIds(nodes) {
    if (!Array.isArray(nodes)) return;
    
    for (const node of nodes) {
      if (!node || !node._id) continue;
      
      // ID'yi ekle
      allIds.push(node._id);
      
      // Alt kategorilerde recursive arama
      if (node.subcategories && node.subcategories.length > 0) {
        collectIds(node.subcategories);
      }
    }
  }
  
  // Ana kategorinin alt kategorilerini topla
  if (category.subcategories && category.subcategories.length > 0) {
    collectIds(category.subcategories);
  }
  
  return allIds;
}

// YENİ VE GELİŞMİŞ ÜRÜN GETİRME ENDPOINT'LERİ
app.get('/api/products/by-category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { includeSubcategories = 'true' } = req.query; // Varsayılan olarak true
    
    console.log('🔵 Ürün getirme isteği - Kategori:', categoryId, 'Alt Kategoriler Dahil:', includeSubcategories);

    // Kategoriyi bul
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    let products = [];
    
    if (includeSubcategories === 'true') {
      // TÜM ALT KATEGORİLERİN ID'LERİNİ TOPLA (DERİN ARAMA)
      const allSubcategoryIds = getAllSubcategoryIds(category);
      const allCategoryIds = [new mongoose.Types.ObjectId(categoryId), ...allSubcategoryIds];
      
      console.log('🔍 Taranacak kategori IDleri:', allCategoryIds.length);
      
      // Tüm kategori ve alt kategorilerdeki ürünleri getir
      products = await Item.find({
        $or: [
          { categoryId: { $in: allCategoryIds } },
          { subcategoryId: { $in: allCategoryIds } }
        ]
      }).sort({ name: 1 });
    } else {
      // Sadece bu kategorideki ürünleri getir
      products = await Item.find({
        $or: [
          { categoryId: new mongoose.Types.ObjectId(categoryId) },
          { subcategoryId: new mongoose.Types.ObjectId(categoryId) }
        ]
      }).sort({ name: 1 });
    }

    console.log('🟢 Bulunan ürün sayısı:', products.length);
    
    res.json({
      category: {
        _id: category._id,
        name: category.name,
        imageUrl: category.imageUrl
      },
      products: products,
      totalProducts: products.length
    });
  } catch (err) {
    console.error('🔴 Ürün getirme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// GELİŞMİŞ ALT KATEGORİ ÜRÜNLERİ ENDPOINT'İ
app.get('/api/products/by-subcategory/:subcategoryId', async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { includeSubcategories = 'true' } = req.query;
    
    console.log('🔵 Alt kategori ürünleri - ID:', subcategoryId, 'Alt Kategoriler Dahil:', includeSubcategories);

    // Alt kategoriyi bulmak için tüm kategorileri ara
    const categories = await Category.find();
    let subcategory = null;
    let parentCategory = null;

    for (const category of categories) {
      const found = findSubcategoryById(category, subcategoryId);
      if (found) {
        subcategory = found;
        parentCategory = category;
        break;
      }
    }

    if (!subcategory) {
      return res.status(404).json({ message: 'Alt kategori bulunamadı' });
    }

    let products = [];
    
    if (includeSubcategories === 'true' && subcategory.subcategories && subcategory.subcategories.length > 0) {
      // Alt kategorinin tüm alt kategorilerini dahil et
      const allSubIds = getAllSubcategoryIds(subcategory);
      const allIds = [new mongoose.Types.ObjectId(subcategoryId), ...allSubIds];
      
      console.log('🔍 Alt kategori taranacak IDler:', allIds.length);
      
      products = await Item.find({
        $or: [
          { categoryId: { $in: allIds } },
          { subcategoryId: { $in: allIds } }
        ]
      }).sort({ name: 1 });
    } else {
      // Sadece bu alt kategorideki ürünleri getir
      products = await Item.find({
        $or: [
          { categoryId: new mongoose.Types.ObjectId(subcategoryId) },
          { subcategoryId: new mongoose.Types.ObjectId(subcategoryId) }
        ]
      }).sort({ name: 1 });
    }

    console.log('🟢 Alt kategori ürün sayısı:', products.length);
    
    res.json({
      category: {
        _id: parentCategory._id,
        name: parentCategory.name
      },
      subcategory: {
        _id: subcategory._id,
        name: subcategory.name,
        imageUrl: subcategory.imageUrl,
        hasSubcategories: subcategory.subcategories && subcategory.subcategories.length > 0
      },
      products: products,
      totalProducts: products.length
    });
  } catch (err) {
    console.error('🔴 Alt kategori ürün getirme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// DEBUG: Kategori hiyerarşisi ve ürün kontrolü
app.get('/api/debug/category-hierarchy/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Tüm alt kategori ID'lerini topla
    const allSubcategoryIds = getAllSubcategoryIds(category);
    const allIds = [new mongoose.Types.ObjectId(categoryId), ...allSubcategoryIds];
    
    // Her bir kategorideki ürünleri kontrol et
    const categoryProducts = await Item.find({
      categoryId: new mongoose.Types.ObjectId(categoryId)
    });
    
    const subcategoryProducts = await Item.find({
      subcategoryId: { $in: allIds }
    });
    
    const allProducts = await Item.find({
      $or: [
        { categoryId: { $in: allIds } },
        { subcategoryId: { $in: allIds } }
      ]
    });

    res.json({
      category: {
        _id: category._id,
        name: category.name,
        subcategoriesCount: category.subcategories?.length || 0
      },
      hierarchy: {
        totalSubcategoryIds: allIds.length,
        allIds: allIds
      },
      products: {
        inCategory: categoryProducts.length,
        inSubcategories: subcategoryProducts.length,
        total: allProducts.length,
        categoryProducts: categoryProducts.map(p => ({ _id: p._id, name: p.name })),
        subcategoryProducts: subcategoryProducts.map(p => ({ _id: p._id, name: p.name, subcategoryId: p.subcategoryId }))
      }
    });
  } catch (err) {
    console.error('Debug hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// FEATURES CRUD ENDPOINTS

// Tüm özellikleri getir
app.get('/api/features', async (req, res) => {
  try {
    const features = await Feature.find().sort({ type: 1, name: 1 });
    res.json(features);
  } catch (err) {
    console.error('🔴 Özellikler getirme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// Yeni özellik ekle
app.post('/api/features', async (req, res) => {
  try {
    const { name, description, type, hasValue } = req.body;
    
    console.log('🔵 Yeni özellik ekleme:', { name, type });

    // Aynı isim ve türde özellik var mı kontrol et
    const existingFeature = await Feature.findOne({ name, type });
    if (existingFeature) {
      return res.status(400).json({ message: 'Bu özellik zaten mevcut' });
    }

    const feature = new Feature({
      name,
      description,
      type,
      hasValue: hasValue || false
    });

    await feature.save();
    console.log('🟢 Özellik başarıyla eklendi:', feature._id);
    res.status(201).json(feature);
  } catch (err) {
    console.error('🔴 Özellik ekleme hatası:', err);
    res.status(400).json({ message: err.message });
  }
});

// Özellik sil
app.delete('/api/features/:id', async (req, res) => {
  try {
    const feature = await Feature.findByIdAndDelete(req.params.id);
    if (!feature) {
      return res.status(404).json({ message: 'Özellik bulunamadı' });
    }
    console.log('🟢 Özellik silindi:', req.params.id);
    res.json({ message: 'Özellik silindi', deletedFeature: feature });
  } catch (err) {
    console.error('🔴 Özellik silme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// Türe göre tüm özellikleri sil
app.delete('/api/features/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await Feature.deleteMany({ type });
    console.log('🟢 Özellikler silindi:', { type, deletedCount: result.deletedCount });
    res.json({ 
      message: `${result.deletedCount} özellik silindi`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('🔴 Özellikler silme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// Toplu özellik ekle
app.post('/api/features/bulk', async (req, res) => {
  try {
    const { features } = req.body;
    
    console.log('🔵 Toplu özellik ekleme:', features.length);

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ message: 'Geçersiz özellik listesi' });
    }

    const results = [];
    const errors = [];

    for (const featureData of features) {
      try {
        // Aynı isim ve türde özellik var mı kontrol et
        const existingFeature = await Feature.findOne({ 
          name: featureData.name, 
          type: featureData.type 
        });

        if (!existingFeature) {
          const feature = new Feature({
            name: featureData.name,
            description: featureData.description,
            type: featureData.type,
            hasValue: featureData.hasValue || false
          });
          await feature.save();
          results.push(feature);
        } else {
          errors.push(`"${featureData.name}" zaten mevcut`);
        }
      } catch (error) {
        errors.push(`"${featureData.name}": ${error.message}`);
      }
    }

    console.log('🟢 Toplu özellik ekleme tamamlandı:', {
      added: results.length,
      errors: errors.length
    });

    res.json({
      message: `${results.length} özellik eklendi, ${errors.length} hata`,
      features: results,
      errors: errors
    });
  } catch (err) {
    console.error('🔴 Toplu özellik ekleme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// Özellik güncelle
app.put('/api/features/:id', async (req, res) => {
  try {
    const { name, description, type, hasValue } = req.body;
    
    const feature = await Feature.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        type,
        hasValue,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!feature) {
      return res.status(404).json({ message: 'Özellik bulunamadı' });
    }

    console.log('🟢 Özellik güncellendi:', feature._id);
    res.json(feature);
  } catch (err) {
    console.error('🔴 Özellik güncelleme hatası:', err);
    res.status(400).json({ message: err.message });
  }
});

// IMAGE UPLOAD ENDPOINTS
app.post('/api/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Resim dosyası bulunamadı' });
    }

    const imageUrls = [];

    for (const file of req.files) {
      try {
        const result = await imagekit.upload({
          file: file.buffer,
          fileName: `product_${Date.now()}_${file.originalname}`,
          folder: '/products'
        });

        imageUrls.push(result.url);
      } catch (uploadError) {
        console.error('ImageKit upload error:', uploadError);
        return res.status(500).json({ message: 'Resim yükleme hatası' });
      }
    }

    res.json({ 
      message: `${imageUrls.length} resim başarıyla yüklendi`,
      imageUrls: imageUrls 
    });
  } catch (err) {
    console.error('Resim yükleme hatası:', err);
    res.status(500).json({ message: 'Resim yükleme hatası' });
  }
});

app.post('/api/upload', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Resim dosyası bulunamadı' });
    }

    const imageUrls = [];

    for (const file of req.files) {
      try {
        const result = await imagekit.upload({
          file: file.buffer,
          fileName: `category_${item.name}`,
          folder: '/categories'
        });

        imageUrls.push(result.url);
      } catch (uploadError) {
        console.error('ImageKit upload error:', uploadError);
        return res.status(500).json({ message: 'Resim yükleme hatası' });
      }
    }

    res.json({ 
      message: `${imageUrls.length} resim başarıyla yüklendi`,
      imageUrls: imageUrls 
    });
  } catch (err) {
    console.error('Resim yükleme hatası:', err);
    res.status(500).json({ message: 'Resim yükleme hatası' });
  }
});

// DEBUG ENDPOINTS
app.get('/api/debug/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    
    // Tüm subcategory'leri ID kontrolü ile logla
    categories.forEach(category => {
      console.log(`Kategori: ${category.name} - Subcategories: ${category.subcategories?.length || 0}`);
      if (category.subcategories) {
        category.subcategories.forEach((sub, index) => {
          console.log(`  ${index}. ${sub.name} - ID: ${sub._id} - ID Type: ${typeof sub._id} - Alt kategori: ${sub.subcategories?.length || 0}`);
        });
      }
    });

    res.json({ 
      count: categories.length, 
      categories: categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        imageUrl: cat.imageUrl,
        subcategoriesCount: cat.subcategories?.length || 0,
        subcategories: cat.subcategories?.map(sub => ({
          _id: sub._id,
          name: sub.name,
          imageUrl: sub.imageUrl,
          subcategoriesCount: sub.subcategories?.length || 0,
          idType: typeof sub._id
        })) || []
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    console.log('=== KATEGORİ DEBUG ===');
    console.log('Kategori:', category.name);
    console.log('Subcategories:', category.subcategories);

    res.json({
      _id: category._id,
      name: category.name,
      imageUrl: category.imageUrl,
      subcategories: category.subcategories,
      subcategoriesCount: category.subcategories?.length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    });
  } catch (err) {
    console.error('Debug hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json({ count: items.length, items: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/features', async (req, res) => {
  try {
    const features = await Feature.find();
    res.json({ 
      count: features.length, 
      features: features,
      byType: {
        usage_area: features.filter(f => f.type === 'usage_area').length,
        product_measurements: features.filter(f => f.type === 'product_measurements').length,
        product_properties: features.filter(f => f.type === 'product_properties').length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CATEGORY CRUD
app.post('/api/categories', async (req, res) => {
  try {
    // Tüm subcategory'lere ObjectId formatında ID ekle
    const categoryData = ensureSubcategoryIds(req.body);
    const category = new Category(categoryData);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GÜNCELLENMİŞ PUT ENDPOINT - ObjectId DESTEKLİ
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, imageUrl, subcategories } = req.body;
    
    console.log('=== KATEGORİ GÜNCELLEME BAŞLANGICI ===');
    console.log('🔵 Kategori ID:', req.params.id);

    // Tüm subcategory'lere ObjectId formatında ID ekle
    const categoryData = ensureSubcategoryIds({
      name,
      imageUrl,
      subcategories
    });

    console.log('🔵 ObjectId eklenmiş veri:', {
      name: categoryData.name,
      subcategoriesCount: categoryData.subcategories?.length || 0
    });

    // Kategoriyi bul
    const category = await Category.findById(req.params.id);
    if (!category) {
      console.log('🔴 Kategori bulunamadı:', req.params.id);
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Field'ları direkt set et
    if (categoryData.name !== undefined) category.name = categoryData.name;
    if (categoryData.imageUrl !== undefined) category.imageUrl = categoryData.imageUrl;
    if (categoryData.subcategories !== undefined) category.subcategories = categoryData.subcategories;

    console.log('🟡 Kayıt öncesi category:', {
      name: category.name,
      subcategoriesCount: category.subcategories?.length || 0
    });

    // Save metodu ile kaydet
    const savedCategory = await category.save();
    
    console.log('🟢 Kayıt sonrası category:', {
      name: savedCategory.name,
      subcategoriesCount: savedCategory.subcategories?.length || 0
    });

    // ID kontrolü
    if (savedCategory.subcategories && savedCategory.subcategories.length > 0) {
      console.log('🟢 Subcategory ID kontrolü (ObjectId formatında):');
      savedCategory.subcategories.forEach((subcat, index) => {
        console.log(`  ${index}. ${subcat.name} - ID: ${subcat._id} - ID Type: ${typeof subcat._id} - Alt kategori: ${subcat.subcategories?.length || 0}`);
      });
    }

    console.log('=== KATEGORİ GÜNCELLEME TAMAMLANDI ===');
    
    res.json(savedCategory);
  } catch (err) {
    console.error('🔴 KATEGORİ GÜNCELLEME HATASI:', err);
    console.error('🔴 Hata detayı:', err.message);
    
    res.status(400).json({ 
      message: err.message || 'Kategori güncellenirken hata oluştu'
    });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });
    res.json({ message: 'Kategori silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ESKİ ENDPOINT (Geriye uyumluluk için)
app.get('/api/categories/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subcategoryId } = req.query;
    
    console.log('🔵 ESKİ ENDPOINT - Ürün getirme isteği - Kategori:', categoryId, 'Alt Kategori:', subcategoryId);

    if (subcategoryId) {
      // Alt kategori için yeni endpoint'e yönlendir
      const response = await getProductsBySubcategory(subcategoryId);
      return res.json(response);
    } else {
      // Ana kategori için yeni endpoint'e yönlendir
      const response = await getProductsByCategory(categoryId, false);
      return res.json(response);
    }
  } catch (err) {
    console.error('🔴 ESKİ ENDPOINT - Ürün getirme hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// SUBCATEGORY MANAGEMENT (nested) - ObjectId formatında
app.post('/api/categories/:id/subcategories', async (req, res) => {
  try {
    const { parentId, name, imageUrl } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });

    const newSubcat = { 
      _id: new mongoose.Types.ObjectId(), // ObjectId formatında
      name, 
      imageUrl, 
      subcategories: [] 
    };

    if (parentId) {
      // parentId string geliyorsa ObjectId'ye çevir
      const parentObjectId = typeof parentId === 'string' ? new mongoose.Types.ObjectId(parentId) : parentId;
      const parent = findSubcategoryById(category, parentObjectId);
      if (!parent) return res.status(404).json({ message: 'Üst alt kategori bulunamadı' });
      parent.subcategories.push(newSubcat);
    } else {
      category.subcategories.push(newSubcat);
    }

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/categories/:id/subcategories/:subId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });

    const subcat = findSubcategoryById(category, req.params.subId);
    if (!subcat) return res.status(404).json({ message: 'Alt kategori bulunamadı' });

    subcat.name = req.body.name || subcat.name;
    subcat.imageUrl = req.body.imageUrl || subcat.imageUrl;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/categories/:id/subcategories/:subId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });

    const removed = removeSubcategoryById(category, req.params.subId);
    if (!removed) return res.status(404).json({ message: 'Alt kategori bulunamadı' });

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GÜNCELLENMİŞ ITEMS CRUD - TÜM SEVİYELERDE KATEGORİ DESTEĞİ
app.post('/api/items', async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log('🔵 Yeni ürün oluşturma isteği:', { categoryId, body: req.body });

    if (!categoryId) {
      return res.status(400).json({ message: 'categoryId gereklidir' });
    }

    // Tüm kategorileri getir
    const categories = await Category.find();
    
    // Kategoriyi herhangi bir seviyede ara
    const category = findCategoryById(categories, categoryId);
    
    if (!category) {
      console.log('🔴 Kategori bulunamadı:', categoryId);
      return res.status(400).json({ message: 'Kategori bulunamadı' });
    }

    console.log('🟢 Kategori bulundu:', category.name);

    // Kategori ismini bulmak için hiyerarşiyi oluştur
    let categoryName = category.name;
    let subcategoryName = '';
    
    // Eğer bu bir alt kategoriyse, ana kategori ismini bul
    if (category._id.toString() !== categoryId) {
      // Bu bir alt kategori, ana kategori ismini bulmaya çalış
      for (const mainCat of categories) {
        const foundSub = findSubcategoryById(mainCat, categoryId);
        if (foundSub) {
          categoryName = mainCat.name;
          subcategoryName = foundSub.name;
          break;
        }
      }
    }

    const item = new Item({
      ...req.body,
      category: categoryName,
      subcategory: subcategoryName,
      categoryId: categoryId
    });

    await item.save();
    console.log('🟢 Ürün başarıyla oluşturuldu:', item._id);
    res.status(201).json(item);
  } catch (err) {
    console.error('🔴 Ürün oluşturma hatası:', err);
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log('🔵 Ürün güncelleme isteği:', { id: req.params.id, categoryId, body: req.body });

    if (!categoryId) {
      return res.status(400).json({ message: 'categoryId gereklidir' });
    }

    // Tüm kategorileri getir
    const categories = await Category.find();
    
    // Kategoriyi herhangi bir seviyede ara
    const category = findCategoryById(categories, categoryId);
    
    if (!category) {
      console.log('🔴 Kategori bulunamadı:', categoryId);
      return res.status(400).json({ message: 'Kategori bulunamadı' });
    }

    console.log('🟢 Kategori bulundu:', category.name);

    // Kategori ismini bulmak için hiyerarşiyi oluştur
    let categoryName = category.name;
    let subcategoryName = '';
    
    // Eğer bu bir alt kategoriyse, ana kategori ismini bul
    if (category._id.toString() !== categoryId) {
      // Bu bir alt kategori, ana kategori ismini bulmaya çalış
      for (const mainCat of categories) {
        const foundSub = findSubcategoryById(mainCat, categoryId);
        if (foundSub) {
          categoryName = mainCat.name;
          subcategoryName = foundSub.name;
          break;
        }
      }
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        category: categoryName,
        subcategory: subcategoryName,
        categoryId: categoryId
      },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Ürün bulunamadı' });
    
    console.log('🟢 Ürün başarıyla güncellendi:', item._id);
    res.json(item);
  } catch (err) {
    console.error('🔴 Ürün güncelleme hatası:', err);
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json({ message: 'Ürün silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SERVER START
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Debug Categories: http://localhost:${PORT}/api/debug/categories`);
  console.log(`Yeni Ürün Endpointleri:`);
  console.log(`- Kategori Ürünleri: http://localhost:${PORT}/api/products/by-category/:categoryId`);
  console.log(`- Alt Kategori Ürünleri: http://localhost:${PORT}/api/products/by-subcategory/:subcategoryId`);
  console.log(`- Debug Hierarchy: http://localhost:${PORT}/api/debug/category-hierarchy/:categoryId`);
  console.log(`Features Endpointleri:`);
  console.log(`- Tüm Özellikler: http://localhost:${PORT}/api/features`);
  console.log(`- Özellik Ekle: http://localhost:${PORT}/api/features (POST)`);
  console.log(`- Toplu Özellik Ekle: http://localhost:${PORT}/api/features/bulk (POST)`);
  console.log(`- Özellik Sil: http://localhost:${PORT}/api/features/:id (DELETE)`);
  console.log(`- Debug Features: http://localhost:${PORT}/api/debug/features`);
});