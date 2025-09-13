const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const ImageKit = require('imagekit');
const app = express();
const PORT = 5002;

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: 'public_UjYJw52KefpFNDwLgSX84uFPlnw=',
  privateKey: 'private_Ah0UG/lM0+LaTvdurbXhnUy2ePk=',
  urlEndpoint: 'https://ik.imagekit.io/4t0zibpdh/'
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Hata ayıklama middleware'leri
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect('mongodb+srv://catalog-app:vlVAbyhQsAh2lUgS@catalog-app.v0tfl.mongodb.net/ravinzo?retryWrites=true&w=majority&appName=catalog-app&', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  console.log('Database:', mongoose.connection.db.databaseName);
  
  // Bağlantı başarılı olduğunda basit bir test yapalım
  Category.find({}).limit(1)
    .then(categories => {
      console.log('Kategori test sorgusu başarılı. Toplam kategori sayısı:', categories.length);
    })
    .catch(err => {
      console.error('Kategori test sorgusu hatası:', err);
    });
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Schemas
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subcategories: [{
    name: { type: String, required: true },
    imageUrl: String
  }],
  imageUrl: String
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: String,
  subcategoryId: { type: mongoose.Schema.Types.ObjectId },
  price: { type: Number, required: true },
  specs: [String],
  images: [String],
}, { timestamps: true });

// Models
const Category = mongoose.model('Category', categorySchema);
const Item = mongoose.model('Item', itemSchema);

// Create indexes
itemSchema.index({ category: 1, subcategory: 1 });
itemSchema.index({ categoryId: 1, subcategoryId: 1 });
categorySchema.index({ name: 1 });

// Debug Endpoints
app.get('/api/debug/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    console.log('Kategoriler:', categories);
    res.json({
      count: categories.length,
      categories: categories
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/items', async (req, res) => {
  try {
    const items = await Item.find();
    console.log('Tüm ürünler:', items);
    res.json({
      count: items.length,
      items: items
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/items/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const items = await Item.find({ category: categoryName });
    console.log(`${categoryName} kategorisindeki ürünler:`, items);
    res.json({
      category: categoryName,
      count: items.length,
      items: items
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/debug/categories-with-ids', async (req, res) => {
  try {
    const categories = await Category.find();
    const result = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      subcategories: cat.subcategories.map(sub => ({
        _id: sub._id,
        name: sub.name
      }))
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Debug için: Kategori ve alt kategori detaylarını getir
app.get('/api/debug/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    // Bu kategorideki ürünleri getir
    const products = await Item.find({ category: category.name });
    
    res.json({
      category: category,
      productsCount: products.length,
      productsSample: products.slice(0, 3),
      subcategories: category.subcategories.map(sub => ({
        _id: sub._id,
        name: sub.name,
        productCount: products.filter(p => p.subcategory === sub.name).length
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API Endpoints

// ITEM ENDPOINTS
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch items',
      error: err.message 
    });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch item',
      error: err.message 
    });
  }
});

app.post('/api/items', 
  [
    body('barcode').trim().notEmpty().withMessage("Barkod Eklemeden Kayıt yapılamaz"),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('specs').optional().isArray(),
    body('specs.*').trim().notEmpty().withMessage('Specification cannot be empty'),
    body('images').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const itemData = {
        ...req.body,
        specs: req.body.specs || [],
        images: req.body.images || []
      };

      const newItem = new Item(itemData);
      const savedItem = await newItem.save();
      
      res.status(201).json(savedItem);
    } catch (err) {
      res.status(400).json({ 
        message: 'Failed to create item',
        error: err.message 
      });
    }
  }
);

app.put('/api/items/:id', 
  [
    body('barcode').trim().notEmpty().withMessage("Barkod Eklemeden Kayıt Yapılamaz"),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('specs').optional().isArray(),
    body('specs.*').trim().notEmpty().withMessage('Specification cannot be empty'),
    body('images').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updateData = {
        ...req.body,
        specs: req.body.specs || [],
        images: req.body.images || []
      };

      const updatedItem = await Item.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (err) {
      res.status(400).json({ 
        message: 'Failed to update item',
        error: err.message 
      });
    }
  }
);

app.delete('/api/items/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to delete item',
      error: err.message 
    });
  }
});

// CATEGORY ENDPOINTS
app.get('/api/categories', async (req, res) => {
  try {
    console.log('Kategoriler isteniyor...');
    
    const categories = await Category.find().lean();
    
    if (!categories || categories.length === 0) {
      console.log('Hiç kategori bulunamadı');
      return res.status(200).json([]);
    }
    
    console.log(`${categories.length} kategori bulundu`);
    res.json(categories);
  } catch (err) {
    console.error('Kategoriler getirilirken hata:', err);
    res.status(500).json({ 
      message: 'Kategoriler getirilirken hata oluştu',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const newCategory = new Category(req.body);
  try {
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ID BAZLI ÜRÜN ENDPOINT'LERİ
app.get('/api/categories/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subcategoryId } = req.query;
    
    console.log('ID ile ürün isteği - Kategori ID:', categoryId, 'Alt Kategori ID:', subcategoryId);
    
    // Kategoriyi ID ile bul
    const category = await Category.findById(categoryId);
    console.log('Bulunan kategori:', category);
    
    if (!category) {
      return res.status(404).json({ 
        message: `Kategori bulunamadı: ${categoryId}`,
        products: []
      });
    }
    
    // Ürünleri filtrele - YÖNTEM 1: categoryId ve subcategoryId ile
    let query = { categoryId: new mongoose.Types.ObjectId(categoryId) };
    
    if (subcategoryId) {
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }
    
    console.log('ID bazlı sorgu:', query);
    
    const products = await Item.find(query).select('-__v');
    console.log('Bulunan ürünler (ID bazlı):', products.length);
    
    // Eğer ID bazlı sorgu sonuç vermezse, eski yöntemle dene
    if (products.length === 0) {
      console.log('ID bazlı sorgu sonuç vermedi, isim bazlı sorgu denenecek...');
      query = { category: category.name };
      
      if (subcategoryId) {
        const subcategory = category.subcategories.id(subcategoryId);
        if (subcategory) {
          query.subcategory = subcategory.name;
        }
      }
      
      console.log('İsim bazlı sorgu:', query);
      const productsByName = await Item.find(query).select('-__v');
      console.log('İsim bazlı bulunan ürünler:', productsByName.length);
      
      return res.json({
        category: {
          _id: category._id,
          name: category.name,
          imageUrl: category.imageUrl
        },
        subcategory: subcategoryId ? category.subcategories.id(subcategoryId) : null,
        products: productsByName,
        queryMethod: 'name-based'
      });
    }
    
    res.json({
      category: {
        _id: category._id,
        name: category.name,
        imageUrl: category.imageUrl
      },
      subcategory: subcategoryId ? category.subcategories.id(subcategoryId) : null,
      products: products,
      queryMethod: 'id-based'
    });
  } catch (err) {
    console.error('ID ile ürün getirme hatası:', err);
    res.status(500).json({ 
      message: 'Ürünler getirilirken hata oluştu',
      error: err.message 
    });
  }
});

// Veritabanındaki ürünleri güncellemek için endpoint
app.post('/api/admin/update-product-references', async (req, res) => {
  try {
    console.log('Ürün referansları güncelleniyor...');
    
    // Tüm kategorileri al
    const categories = await Category.find();
    let updatedCount = 0;
    
    for (const category of categories) {
      console.log(`Kategori işleniyor: ${category.name}`);
      
      // Kategoriye ait ürünleri güncelle
      const categoryUpdateResult = await Item.updateMany(
        { category: category.name },
        { $set: { categoryId: category._id } }
      );
      
      console.log(`Kategori ${category.name} için ${categoryUpdateResult.modifiedCount} ürün güncellendi`);
      
      // Alt kategorileri işle
      for (const subcategory of category.subcategories) {
        const subcategoryUpdateResult = await Item.updateMany(
          { 
            category: category.name,
            subcategory: subcategory.name 
          },
          { $set: { 
            categoryId: category._id,
            subcategoryId: subcategory._id 
          } }
        );
        
        console.log(`Alt kategori ${subcategory.name} için ${subcategoryUpdateResult.modifiedCount} ürün güncellendi`);
        updatedCount += subcategoryUpdateResult.modifiedCount;
      }
      
      updatedCount += categoryUpdateResult.modifiedCount;
    }
    
    res.json({
      message: 'Ürün referansları güncellendi',
      updatedCount: updatedCount
    });
    
  } catch (err) {
    console.error('Ürün referansları güncelleme hatası:', err);
    res.status(500).json({ 
      message: 'Ürün referansları güncellenirken hata oluştu',
      error: err.message 
    });
  }
});

// ESKİ İSİM BAZLI ENDPOINT'LER (Geriye dönük uyumluluk)
app.get('/api/items/:categoryName/:subcategoryName?', async (req, res) => {
  try {
    const { categoryName, subcategoryName } = req.params;
    console.log('İstek geldi - Kategori:', categoryName, 'Alt Kategori:', subcategoryName);
    
    // Kategoriyi case-insensitive bul
    const category = await Category.findOne({ 
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
    }).select('-__v');
    
    console.log('Bulunan kategori:', category);
    
    if (!category) {
      console.log('Kategori bulunamadı:', categoryName);
      return res.status(404).json({ 
        message: `Kategori bulunamadı: ${categoryName}`,
        category: categoryName,
        subcategory: subcategoryName || null,
        products: []
      });
    }
    
    // Ürünleri filtrele - kategori ismini database'de kayıtlı olan haliyle kullan
    const query = { category: category.name };
    console.log('Başlangıç query:', query);
    
    if (subcategoryName) {
      // Alt kategoriyi de case-insensitive bul
      const subcategory = category.subcategories.find(
        sc => sc.name.toLowerCase() === subcategoryName.toLowerCase()
      );
      
      if (subcategory) {
        query.subcategory = subcategory.name;
        console.log('Alt kategori filtresi eklendi:', query);
      } else {
        console.log('Alt kategori bulunamadı:', subcategoryName);
      }
    }

    const products = await Item.find(query).select('-__v');
    console.log('Bulunan ürünler:', products);
    
    // Alt kategori resmini bul
    let subcategoryImage = null;
    if (subcategoryName && category.subcategories) {
      const subcat = category.subcategories.find(
        sc => sc.name.toLowerCase() === subcategoryName.toLowerCase()
      );
      subcategoryImage = subcat ? subcat.imageUrl : null;
      console.log('Alt kategori resmi:', subcategoryImage);
    }

    const response = {
      category: category.name,
      subcategory: subcategoryName || null,
      products: products,
      categoryImage: category.imageUrl || null,
      subcategoryImage: subcategoryImage
    };

    console.log('Response hazır:', response);
    res.json(response);
  } catch (err) {
    console.error('Kategori ürünleri getirilirken hata:', err);
    res.status(500).json({ 
      message: 'Ürünler getirilirken hata oluştu',
      error: err.message 
    });
  }
});

app.get('/api/items/id/:productId', async (req, res) => {
  try {
    const product = await Item.findById(req.params.productId).select('-__v');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/items/filter', async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    const products = await Item.find(query).select('-__v');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// IMAGE UPLOAD ENDPOINT (ImageKit integration)
app.post('/api/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        imagekit.upload({
          file: file.buffer,
          fileName: `${Date.now()}-${file.originalname}`,
          folder: '/catalog-app'
        }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.url);
          }
        });
      });
    });

    const imageUrls = await Promise.all(uploadPromises);
    res.json({ imageUrls });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ 
      message: 'Image upload failed', 
      error: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // MongoDB bağlantısını test et
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbStatus] || 'unknown';
    
    // Kategori sayısını al
    const categoryCount = await Category.countDocuments();
    // Ürün sayısını al
    const itemCount = await Item.countDocuments();
    
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: {
        status: dbStatusText,
        connected: dbStatus === 1,
        categoryCount: categoryCount,
        itemCount: itemCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Debug Endpoints:`);
  console.log(`- http://localhost:${PORT}/api/debug/categories`);
  console.log(`- http://localhost:${PORT}/api/debug/items`);
  console.log(`- http://localhost:${PORT}/api/debug/categories-with-ids`);
  console.log(`- http://localhost:${PORT}/api/debug/category/:categoryId`);
  console.log(`- http://localhost:${PORT}/api/categories`);
  console.log(`\nAdmin Endpoint:`);
  console.log(`- http://localhost:${PORT}/api/admin/update-product-references (POST)`);
});