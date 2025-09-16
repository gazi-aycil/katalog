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
const PORT = 5002;

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: 'public_UjYJw52KefpFNDwLgSX84uFPlnw=',
  privateKey: 'private_Ah0UG/lM0+LaTvdurbXhnUy2ePk=',
  urlEndpoint: 'https://ik.imagekit.io/4t0zibpdh/'
});

// Middleware
app.use(cors());
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
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadExcel = multer({ 
  storage: excelStorage,
  fileFilter: function (req, file, cb) {
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları yükleyebilirsiniz (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
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
        category: category.name,
        categoryId: req.body.categoryId,
        subcategory: subcategoryName,
        subcategoryId: req.body.subcategoryId || null,
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

// EXCEL IMPORT/EXPORT ENDPOINT'LERİ

// Excel Şablonu İndirme Endpoint'i
app.get('/api/export/products-template', async (req, res) => {
  try {
    // Kategorileri al
    const categories = await Category.find();
    
    // Excel verisini hazırla
    const templateData = [
      // Başlık satırı
      [
        'barcode', 'name', 'description', 'category', 'categoryId', 
        'subcategory', 'subcategoryId', 'price', 'specs', 'images'
      ],
      // Örnek veri satırı
      [
        '1234567890', 'Ürün Adı', 'Ürün Açıklaması', 'Elektronik', 'kategori_id_1',
        'Bilgisayar', 'altkategori_id_1', '1000.00', 'Özellik 1|Özellik 2', 'https://example.com/resim1.jpg|https://example.com/resim2.jpg'
      ],
      // Açıklama satırı
      [
        'ZORUNLU', 'ZORUNLU', 'Opsiyonel', 'ZORUNLU', 'ZORUNLU (Kategori ID)',
        'Opsiyonel', 'Opsiyonel (Alt Kategori ID)', 'ZORUNLU', 'Özellikler | ile ayrılır', 'Resim URLleri | ile ayrılır'
      ]
    ];

    // Kategori referans sayfası
    const categoryData = [
      ['Kategori ID', 'Kategori Adı', 'Alt Kategori ID', 'Alt Kategori Adı'],
      ...categories.flatMap(category => 
        category.subcategories.length > 0 
          ? category.subcategories.map((subcat, index) => [
              index === 0 ? category._id.toString() : '',
              index === 0 ? category.name : '',
              subcat._id.toString(),
              subcat.name
            ])
          : [[category._id.toString(), category.name, '', '']]
      )
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
      ['category', 'Kategori adı', 'ZORUNLU', 'Metin'],
      ['categoryId', 'Kategori ID', 'ZORUNLU', 'Metin (Kategori Referansları sayfasından alınabilir)'],
      ['subcategory', 'Alt kategori adı', 'OPSİYONEL', 'Metin'],
      ['subcategoryId', 'Alt kategori ID', 'OPSİYONEL', 'Metin (Kategori Referansları sayfasından alınabilir)'],
      ['price', 'Ürün fiyatı', 'ZORUNLU', 'Sayı (1000.00)'],
      ['specs', 'Ürün özellikleri', 'OPSİYONEL', 'Özellikler | karakteri ile ayrılır'],
      ['images', 'Resim URLleri', 'OPSİYONEL', 'URLler | karakteri ile ayrılır'],
      ['', '', '', ''],
      ['ÖNEMLİ NOTLAR:', '', '', ''],
      ['- categoryId ve category alanları her ikisi de doldurulmalıdır', '', '', ''],
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
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel dosyası yüklenmedi' });
    }

    console.log('Excel dosyası işleniyor:', req.file.filename);

    // Excel dosyasını oku
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets['Ürün Şablonu'];
    
    if (!worksheet) {
      fs.unlinkSync(req.file.path); // Dosyayı sil
      return res.status(400).json({ message: 'Excel dosyasında "Ürün Şablonu" sayfası bulunamadı' });
    }

    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
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
      const rowNumber = i + 2; // Başlık satırı +1

      try {
        // Validasyon
        if (!row.barcode || !row.name || !row.category || !row.categoryId || !row.price) {
          results.errors.push({
            row: rowNumber,
            error: 'Zorunlu alanlar eksik (barcode, name, category, categoryId, price)',
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

        // Alt kategori kontrolü
        if (row.subcategoryId) {
          const subcategory = category.subcategories.id(row.subcategoryId);
          if (!subcategory) {
            results.errors.push({
              row: rowNumber,
              error: `Geçersiz alt kategori ID: ${row.subcategoryId}`,
              data: row
            });
            results.skipped++;
            continue;
          }
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
          category: row.category,
          categoryId: row.categoryId,
          subcategory: row.subcategory || '',
          subcategoryId: row.subcategoryId || null,
          price: parseFloat(row.price),
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

    res.json({
      message: 'Excel import işlemi tamamlandı',
      results: results
    });

  } catch (err) {
    // Hata durumunda dosyayı temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Excel import hatası:', err);
    res.status(500).json({ 
      message: 'Excel import işlemi sırasında hata oluştu',
      error: err.message 
    });
  }
});

// Mevcut ürünleri excel olarak export et
app.get('/api/export/products', async (req, res) => {
  try {
    const products = await Item.find().populate('categoryId', 'name');
    
    const data = products.map(product => ({
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      category: product.category,
      categoryId: product.categoryId._id,
      subcategory: product.subcategory,
      subcategoryId: product.subcategoryId,
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\nExcel Endpoints:`);
  console.log(`- http://localhost:${PORT}/api/export/products-template (GET) - Şablon indir`);
  console.log(`- http://localhost:${PORT}/api/import/products-excel (POST) - Excel yükle`);
  console.log(`- http://localhost:${PORT}/api/export/products (GET) - Ürünleri export et`);
  console.log(`\nAdmin Endpoints:`);
  console.log(`- http://localhost:${PORT}/api/admin/update-product-references (POST) - Referansları güncelle`);
});