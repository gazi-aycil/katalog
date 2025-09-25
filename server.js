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

// CORS ayarlarını genişlet
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Hata ayıklama middleware'leri
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Uploads klasörünü kontrol et ve oluştur
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage (resimler için)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Excel dosyaları için multer konfigürasyonu
const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Türkçe karakterleri düzelt
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
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// Multer hata yönetimi
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dosya boyutu çok büyük (max 20MB)' });
    }
  }
  next(error);
});

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

// Schemas - MODÜLER KATEGORİ YAPISI
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    default: null 
  },
  path: { type: String, default: '' },
  level: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sanal alanlar - Alt kategorileri otomatik getir
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// Path'i otomatik güncelleme middleware
categorySchema.pre('save', async function(next) {
  if (this.parentId) {
    const parent = await mongoose.model('Category').findById(this.parentId);
    if (parent) {
      this.path = parent.path ? `${parent.path}/${parent._id}` : parent._id.toString();
      this.level = parent.level + 1;
    }
  } else {
    this.path = '';
    this.level = 0;
  }
  next();
});

// Özyinelemeli populate için metod
categorySchema.methods.getFullHierarchy = async function() {
  const category = this.toObject();
  
  const populateChildren = async (cat) => {
    const children = await mongoose.model('Category')
      .find({ parentId: cat._id, isActive: true })
      .sort({ sortOrder: 1, name: 1 });
    
    if (children.length > 0) {
      cat.subcategories = [];
      for (let child of children) {
        const childObj = child.toObject();
        await populateChildren(childObj);
        cat.subcategories.push(childObj);
      }
    }
    return cat;
  };
  
  return await populateChildren(category);
};

// Tüm hiyerarşiyi getiren statik metod
categorySchema.statics.getFullTree = async function() {
  const rootCategories = await this.find({ 
    parentId: null, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
  
  const populateTree = async (categories) => {
    for (let category of categories) {
      const children = await this.find({ 
        parentId: category._id, 
        isActive: true 
      }).sort({ sortOrder: 1, name: 1 });
      
      if (children.length > 0) {
        category.subcategories = children;
        await populateTree(children);
      }
    }
    return categories;
  };
  
  return await populateTree(rootCategories);
};

// Flat list için statik metod
categorySchema.statics.getFlatList = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .populate('parentId', 'name');
  
  return categories.map(cat => {
    const prefix = '--'.repeat(cat.level);
    return {
      ...cat.toObject(),
      displayName: `${prefix} ${cat.name}`.trim()
    };
  });
};

const itemSchema = new mongoose.Schema({
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: mongoose.Schema.Types.Mixed, required: true },
  specs: [String],
  images: [String],
}, { timestamps: true });

// Models
const Category = mongoose.model('Category', categorySchema);
const Item = mongoose.model('Item', itemSchema);

// Create indexes
itemSchema.index({ categoryId: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ path: 1 });

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
    const items = await Item.find().populate('categoryId');
    res.json({
      count: items.length,
      items: items
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// YENİ KATEGORİ ENDPOINT'LERİ

// Tüm hiyerarşiyi getir
app.get('/api/categories/tree', async (req, res) => {
  try {
    const categories = await Category.getFullTree();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategori ağacı getirilirken hata oluştu',
      error: err.message
    });
  }
});

// Düz liste olarak getir (seviye bilgisiyle)
app.get('/api/categories/flat', async (req, res) => {
  try {
    const categories = await Category.getFlatList();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategori listesi getirilirken hata oluştu',
      error: err.message
    });
  }
});

// Geleneksel liste (eski uyumluluk için)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategoriler getirilirken hata oluştu',
      error: err.message
    });
  }
});

// Belirli bir kategorinin tam hiyerarşisini getir
app.get('/api/categories/:id/hierarchy', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    const fullHierarchy = await category.getFullHierarchy();
    res.json(fullHierarchy);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategori hiyerarşisi getirilirken hata oluştu',
      error: err.message
    });
  }
});

// Alt kategorileri getir
app.get('/api/categories/:parentId/children', async (req, res) => {
  try {
    const children = await Category.find({ 
      parentId: req.params.parentId,
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 });
    
    res.json(children);
  } catch (err) {
    res.status(500).json({ 
      message: 'Alt kategoriler getirilirken hata oluştu',
      error: err.message
    });
  }
});

// Kök kategorileri getir
app.get('/api/categories/roots', async (req, res) => {
  try {
    const roots = await Category.find({ 
      parentId: null,
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 });
    
    res.json(roots);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kök kategoriler getirilirken hata oluştu',
      error: err.message
    });
  }
});

// Kategori detayı
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

// Yeni kategori oluştur
app.post('/api/categories', async (req, res) => {
  try {
    // Parent kategori kontrolü
    if (req.body.parentId) {
      const parentCategory = await Category.findById(req.body.parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Geçersiz üst kategori ID' });
      }
    }

    const newCategory = new Category(req.body);
    const savedCategory = await newCategory.save();
    
    // Tam hiyerarşi ile birlikte döndür
    const fullCategory = await savedCategory.getFullHierarchy();
    res.status(201).json(fullCategory);
  } catch (err) {
    res.status(400).json({ 
      message: 'Kategori oluşturulurken hata oluştu',
      error: err.message
    });
  }
});

// Kategori güncelle
app.put('/api/categories/:id', async (req, res) => {
  try {
    // Parent değişikliği kontrolü (kendini parent yapmamalı)
    if (req.body.parentId === req.params.id) {
      return res.status(400).json({ message: 'Kategori kendisinin üst kategorisi olamaz' });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ 
      message: 'Kategori güncellenirken hata oluştu',
      error: err.message
    });
  }
});

// Kategori sil (soft delete)
app.delete('/api/categories/:id', async (req, res) => {
  try {
    // Alt kategorileri kontrol et
    const childCount = await Category.countDocuments({ 
      parentId: req.params.id, 
      isActive: true 
    });
    
    if (childCount > 0) {
      return res.status(400).json({ 
        message: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.'
      });
    }

    // İlişkili ürünleri kontrol et
    const productCount = await Item.countDocuments({ 
      categoryId: req.params.id 
    });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Bu kategoride ürünler var. Önce ürünleri silin veya taşıyın.'
      });
    }

    const deletedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.json({ message: 'Kategori silindi' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategori silinirken hata oluştu',
      error: err.message
    });
  }
});

// Kategori sıralamasını güncelle
app.put('/api/categories/:id/sort', async (req, res) => {
  try {
    const { sortOrder } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { sortOrder },
      { new: true }
    );
    
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ 
      message: 'Sıralama güncellenirken hata oluştu',
      error: err.message
    });
  }
});

// ÜRÜN ENDPOINT'LERİ (Güncellenmiş)

// Özel fiyat validasyon fonksiyonu
const validatePrice = (value) => {
  if (value === 'Fiyat Alınız') return true;
  if (typeof value === 'number' && value >= 0) return true;
  if (typeof value === 'string' && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) return true;
  throw new Error('Geçerli bir fiyat girin veya "Fiyat Alınız" seçin');
};

app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().populate('categoryId').sort({ createdAt: -1 });
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
    const item = await Item.findById(req.params.id).populate('categoryId');
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
    body('categoryId').isMongoId().withMessage('Valid category ID is required'),
    body('price').custom(validatePrice).withMessage('Valid price is required'),
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
      console.log('Yeni ürün ekleniyor:', req.body);

      // Kategoriyi doğrula
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          message: 'Geçersiz kategori ID' 
        });
      }

      // Fiyat değerini işle
      let finalPrice;
      if (req.body.price === 'Fiyat Alınız') {
        finalPrice = 'Fiyat Alınız';
      } else {
        finalPrice = typeof req.body.price === 'string' ? parseFloat(req.body.price) : req.body.price;
      }

      // Ürün verilerini hazırla
      const itemData = {
        barcode: req.body.barcode,
        name: req.body.name,
        description: req.body.description || '',
        categoryId: req.body.categoryId,
        price: finalPrice,
        specs: req.body.specs || [],
        images: req.body.images || []
      };

      console.log('Ürün verisi hazır:', itemData);

      const newItem = new Item(itemData);
      const savedItem = await newItem.save();
      
      // Kategori bilgisi ile birlikte döndür
      const populatedItem = await Item.findById(savedItem._id).populate('categoryId');
      
      console.log('Ürün başarıyla kaydedildi:', populatedItem);
      res.status(201).json(populatedItem);
    } catch (err) {
      console.error('Ürün oluşturma hatası:', err);
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
    body('categoryId').isMongoId().withMessage('Valid category ID is required'),
    body('price').custom(validatePrice).withMessage('Valid price is required'),
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
      console.log('Ürün güncelleniyor:', req.params.id, req.body);

      // Kategori doğrulama
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          message: 'Geçersiz kategori ID' 
        });
      }

      // Fiyat değerini işle
      let finalPrice;
      if (req.body.price === 'Fiyat Alınız') {
        finalPrice = 'Fiyat Alınız';
      } else {
        finalPrice = typeof req.body.price === 'string' ? parseFloat(req.body.price) : req.body.price;
      }

      const updateData = {
        barcode: req.body.barcode,
        name: req.body.name,
        description: req.body.description || '',
        categoryId: req.body.categoryId,
        price: finalPrice,
        specs: req.body.specs || [],
        images: req.body.images || []
      };

      console.log('Güncelleme verisi:', updateData);

      const updatedItem = await Item.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryId');
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (err) {
      console.error('Ürün güncelleme hatası:', err);
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

// Kategoriye göre ürünleri getir
app.get('/api/categories/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Kategoriyi ID ile bul
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ 
        message: `Kategori bulunamadı: ${categoryId}`,
        products: []
      });
    }
    
    // Alt kategori ID'lerini bul (özyinelemeli)
    const getSubcategoryIds = async (catId) => {
      const subcategories = await Category.find({ parentId: catId, isActive: true });
      let ids = [catId];
      
      for (let subcat of subcategories) {
        const subIds = await getSubcategoryIds(subcat._id);
        ids = ids.concat(subIds);
      }
      
      return ids;
    };
    
    const allCategoryIds = await getSubcategoryIds(categoryId);
    const products = await Item.find({ categoryId: { $in: allCategoryIds } })
      .populate('categoryId')
      .select('-__v');
    
    res.json({
      category: category,
      products: products
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Ürünler getirilirken hata oluştu',
      error: err.message 
    });
  }
});

// EXCEL IMPORT/EXPORT ENDPOINT'LERİ (Güncellenmiş)

// Excel Şablonu İndirme Endpoint'i
app.get('/api/export/products-template', async (req, res) => {
  try {
    // Kategorileri al
    const categories = await Category.getFlatList();
    
    // Excel verisini hazırla
    const templateData = [
      // Başlık satırı
      ['barcode', 'name', 'description', 'categoryId', 'price', 'specs', 'images'],
      // Örnek veri satırı
      [
        '1234567890', 
        'Ürün Adı', 
        'Ürün Açıklaması', 
        categories.length > 0 ? categories[0]._id : 'kategori_id_1',
        '1000.00', 
        'Özellik 1|Özellik 2', 
        'https://example.com/resim1.jpg|https://example.com/resim2.jpg'
      ],
      // Fiyat Alınız örneği
      [
        '1234567891', 
        'Özel Ürün', 
        'Fiyat için iletişime geçin', 
        categories.length > 0 ? categories[0]._id : 'kategori_id_1',
        'Fiyat Alınız', 
        'Özellik 1|Özellik 2', 
        'https://example.com/resim3.jpg'
      ],
      // Açıklama satırı
      [
        'ZORUNLU', 
        'ZORUNLU', 
        'Opsiyonel', 
        'ZORUNLU (Kategori ID)', 
        'ZORUNLU (Sayı veya "Fiyat Alınız")', 
        'Özellikler | ile ayrılır', 
        'Resim URLleri | ile ayrılır'
      ]
    ];

    // Kategori referans sayfası
    const categoryData = [
      ['Kategori ID', 'Kategori Adı', 'Seviye'],
      ...categories.map(cat => [
        cat._id.toString(),
        cat.displayName,
        cat.level
      ])
    ];

    // Workbook oluştur
    const workbook = XLSX.utils.book_new();
    
    // Ana veri sayfası
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürün Şablonu');
    
    // Kategori referans sayfası
    const categoryWorksheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categoryWorksheet, 'Kategori Referansları');
    
    // Açıklama sayfası
    const instructions = [
      ['ALAN ADI', 'AÇIKLAMA', 'ZORUNLULUK', 'FORMAT'],
      ['barcode', 'Ürün barkodu', 'ZORUNLU', 'Metin'],
      ['name', 'Ürün adı', 'ZORUNLU', 'Metin'],
      ['description', 'Ürün açıklaması', 'OPSİYONEL', 'Metin'],
      ['categoryId', 'Kategori ID', 'ZORUNLU', 'Metin (Kategori Referansları sayfasından alınabilir)'],
      ['price', 'Ürün fiyatı', 'ZORUNLU', 'Sayı (1000.00) veya "Fiyat Alınız" metni'],
      ['specs', 'Ürün özellikleri', 'OPSİYONEL', 'Özellikler | karakteri ile ayrılır'],
      ['images', 'Resim URLleri', 'OPSİYONEL', 'URLler | karakteri ile ayrılır'],
      ['', '', '', ''],
      ['ÖNEMLİ NOTLAR:', '', '', ''],
      ['- categoryId alanı zorunludur', '', '', ''],
      ['- price alanına sayısal değer veya "Fiyat Alınız" yazılabilir', '', '', ''],
      ['- Excel dosyasını kaydetmeden önce "Ürün Şablonu" sayfasındaki örnek satırları silin', '', '', ''],
      ['- Sadece "Ürün Şablonu" sayfasındaki veriler işlenecektir', '', '', '']
    ];
    
    const instructionWorksheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionWorksheet, 'Yönergeler');

    // Buffer'a yaz
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Dosyayı gönder
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=urun-sablonu.xlsx');
    res.send(buffer);

    console.log('Excel şablonu indirildi');

  } catch (err) {
    console.error('Şablon oluşturma hatası:', err);
    res.status(500).json({ 
      message: 'Şablon oluşturulurken hata oluştu',
      error: err.message 
    });
  }
});

// Excel Import Endpoint'i
app.post('/api/import/products-excel', uploadExcel.single('excelFile'), async (req, res) => {
  console.log('🔵 Excel import endpointi çağrıldı');
  
  try {
    if (!req.file) {
      console.log('❌ Dosya yüklenmedi');
      return res.status(400).json({ message: 'Excel dosyası yüklenmedi' });
    }

    console.log('✅ Dosya alındı:', req.file.filename);

    // Excel dosyasını oku
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets['Ürün Şablonu'];
    
    if (!worksheet) {
      console.log('❌ Ürün Şablonu worksheeti bulunamadı');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel dosyasında "Ürün Şablonu" sayfası bulunamadı' });
    }

    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log('📈 Okunan veri satır sayısı:', data.length);
    
    if (data.length === 0) {
      console.log('❌ İşlenecek veri bulunamadı');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel dosyasında işlenecek veri bulunamadı' });
    }

    const results = {
      total: data.length,
      success: 0,
      errors: [],
      skipped: 0
    };

    // Ürünleri işle
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        // Validasyon
        if (!row.barcode || !row.name || !row.categoryId || !row.price) {
          results.errors.push({
            row: rowNumber,
            error: 'Zorunlu alanlar eksik (barcode, name, categoryId, price)',
            data: row
          });
          results.skipped++;
          continue;
        }

        // Kategori kontrolü
        const category = await Category.findById(row.categoryId);
        if (!category) {
          results.errors.push({
            row: rowNumber,
            error: `Geçersiz kategori ID: ${row.categoryId}`,
            data: row
          });
          results.skipped++;
          continue;
        }

        // Fiyat validasyonu
        let finalPrice;
        if (row.price === 'Fiyat Alınız') {
          finalPrice = 'Fiyat Alınız';
        } else {
          const priceValue = parseFloat(row.price);
          if (isNaN(priceValue) || priceValue < 0) {
            results.errors.push({
              row: rowNumber,
              error: 'Geçersiz fiyat değeri',
              data: row
            });
            results.skipped++;
            continue;
          }
          finalPrice = priceValue;
        }

        // Specs'i array'e çevir
        const specsArray = row.specs ? row.specs.split('|').filter(spec => spec.trim()) : [];

        // Images'ı array'e çevir
        const imagesArray = row.images ? row.images.split('|').filter(img => img.trim()) : [];

        // Ürün verisi
        const productData = {
          barcode: row.barcode.toString(),
          name: row.name,
          description: row.description || '',
          categoryId: row.categoryId,
          price: finalPrice,
          specs: specsArray,
          images: imagesArray
        };

        // Ürünü kaydet (güncelleme veya yeni ekleme)
        const existingProduct = await Item.findOne({ barcode: productData.barcode });
        
        if (existingProduct) {
          // Güncelleme
          await Item.findByIdAndUpdate(existingProduct._id, productData);
          results.success++;
        } else {
          // Yeni ekleme
          const newProduct = new Item(productData);
          await newProduct.save();
          results.success++;
        }

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: error.message,
          data: row
        });
        results.skipped++;
      }
    }

    // Dosyayı temizle
    fs.unlinkSync(req.file.path);

    console.log('✅ Import işlemi tamamlandı:', results);

    res.json({
      message: 'Excel import işlemi tamamlandı',
      results: results
    });

  } catch (err) {
    // Hata durumunda dosyayı temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('🔥 Excel import hatası:', err);
    res.status(500).json({ 
      message: 'Excel import işlemi sırasında hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Mevcut ürünleri excel olarak export et
app.get('/api/export/products', async (req, res) => {
  try {
    const products = await Item.find().populate('categoryId');
    
    const data = products.map(product => ({
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId._id,
      price: product.price,
      specs: product.specs.join('|'),
      images: product.images.join('|'),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=urunler.xlsx');
    res.send(buffer);

  } catch (err) {
    console.error('Ürün export hatası:', err);
    res.status(500).json({ 
      message: 'Ürünler export edilirken hata oluştu',
      error: err.message 
    });
  }
});

// IMAGE UPLOAD ENDPOINT
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
    
    const categoryCount = await Category.countDocuments({ isActive: true });
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\nKategori Endpoints:`);
  console.log(`- http://localhost:${PORT}/api/categories/tree (GET) - Ağaç yapısında kategoriler`);
  console.log(`- http://localhost:${PORT}/api/categories/flat (GET) - Düz liste kategoriler`);
  console.log(`- http://localhost:${PORT}/api/categories/roots (GET) - Kök kategoriler`);
  console.log(`\nExcel Endpoints:`);
  console.log(`- http://localhost:${PORT}/api/export/products-template (GET) - Şablon indir`);
  console.log(`- http://localhost:${PORT}/api/import/products-excel (POST) - Excel yükle`);
});