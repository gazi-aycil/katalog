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
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
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
    res.json({
      count: items.length,
      items: items
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

// YENİ VE DÜZELTİLMİŞ ÜRÜN EKLEME ENDPOINTİ
app.post('/api/items', 
  [
    body('barcode').trim().notEmpty().withMessage("Barkod Eklemeden Kayıt yapılamaz"),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('categoryId').isMongoId().withMessage('Valid category ID is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('specs').optional().isArray(),
    body('specs.*').trim().notEmpty().withMessage('Specification cannot be empty'),
    body('images').optional().isArray(),
    body('subcategoryId').optional().isMongoId().withMessage('Valid subcategory ID is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Yeni ürün ekleniyor:', req.body);

      // Kategoriyi doğrula
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          message: 'Geçersiz kategori ID' 
        });
      }

      // Alt kategoriyi doğrula (eğer varsa)
      let subcategoryName = null;
      if (req.body.subcategoryId) {
        const subcategory = category.subcategories.id(req.body.subcategoryId);
        if (!subcategory) {
          return res.status(400).json({ 
            message: 'Geçersiz alt kategori ID' 
          });
        }
        subcategoryName = subcategory.name;
      }

      // Ürün verilerini hazırla
      const itemData = {
        barcode: req.body.barcode,
        name: req.body.name,
        description: req.body.description || '',
        category: category.name, // Kategori ismi
        categoryId: req.body.categoryId, // Kategori ID
        subcategory: subcategoryName, // Alt kategori ismi
        subcategoryId: req.body.subcategoryId || null, // Alt kategori ID
        price: req.body.price,
        specs: req.body.specs || [],
        images: req.body.images || []
      };

      console.log('Ürün verisi hazır:', itemData);

      const newItem = new Item(itemData);
      const savedItem = await newItem.save();
      
      console.log('Ürün başarıyla kaydedildi:', savedItem);
      res.status(201).json(savedItem);
    } catch (err) {
      console.error('Ürün oluşturma hatası:', err);
      res.status(400).json({ 
        message: 'Failed to create item',
        error: err.message 
      });
    }
  }
);

// GÜNCELLENMİŞ ÜRÜN DÜZENLEME ENDPOINTİ
app.put('/api/items/:id', 
  [
    body('barcode').trim().notEmpty().withMessage("Barkod Eklemeden Kayıt Yapılamaz"),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('categoryId').isMongoId().withMessage('Valid category ID is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('specs').optional().isArray(),
    body('specs.*').trim().notEmpty().withMessage('Specification cannot be empty'),
    body('images').optional().isArray(),
    body('subcategoryId').optional().isMongoId().withMessage('Valid subcategory ID is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Kategori doğrulama
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          message: 'Geçersiz kategori ID' 
        });
      }

      // Alt kategori doğrulama
      let subcategoryName = null;
      if (req.body.subcategoryId) {
        const subcategory = category.subcategories.id(req.body.subcategoryId);
        if (!subcategory) {
          return res.status(400).json({ 
            message: 'Geçersiz alt kategori ID' 
          });
        }
        subcategoryName = subcategory.name;
      }

      const updateData = {
        ...req.body,
        category: category.name,
        subcategory: subcategoryName,
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
    const categories = await Category.find().lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategoriler getirilirken hata oluştu',
      error: err.message
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
    
    // Kategoriyi ID ile bul
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ 
        message: `Kategori bulunamadı: ${categoryId}`,
        products: []
      });
    }
    
    // Ürünleri filtrele
    const query = { categoryId: new mongoose.Types.ObjectId(categoryId) };
    
    if (subcategoryId) {
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }

    const products = await Item.find(query).select('-__v');
    
    res.json({
      category: {
        _id: category._id,
        name: category.name,
        imageUrl: category.imageUrl
      },
      subcategory: subcategoryId ? category.subcategories.id(subcategoryId) : null,
      products: products
    });
  } catch (err) {
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
      // Kategoriye ait ürünleri güncelle
      const categoryUpdateResult = await Item.updateMany(
        { category: category.name },
        { $set: { categoryId: category._id } }
      );
      
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
        
        updatedCount += subcategoryUpdateResult.modifiedCount;
      }
      
      updatedCount += categoryUpdateResult.modifiedCount;
    }
    
    res.json({
      message: 'Ürün referansları güncellendi',
      updatedCount: updatedCount
    });
    
  } catch (err) {
    res.status(500).json({ 
      message: 'Ürün referansları güncellenirken hata oluştu',
      error: err.message 
    });
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
    res.status(500).json({ 
      message: 'Image upload failed', 
      error: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbStatus] || 'unknown';
    
    const categoryCount = await Category.countDocuments();
    const itemCount = await Item.countDocuments();
    
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: {
        status: dbStatusText,
        connected: dbStatus === 1,
        categoryCount: categoryCount,
        itemCount: itemCount
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server error',
      error: err.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});