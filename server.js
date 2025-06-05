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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  subcategory: String,
  price: { type: Number, required: true },
  specs: [String],
  images: [String],
}, { timestamps: true });

// Models
const Category = mongoose.model('Category', categorySchema);
const Item = mongoose.model('Item', itemSchema);

// Create indexes
itemSchema.index({ category: 1, subcategory: 1 });
categorySchema.index({ name: 1 });

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
    const categories = await Category.find();
    res.json(categories);
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

// PRODUCTS ENDPOINTS
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

app.get('/api/items/:categoryName/:subcategoryName?', async (req, res) => {
  try {
    const { categoryName, subcategoryName } = req.params;
    
    const query = { category: categoryName };
    if (subcategoryName) {
      query.subcategory = subcategoryName;
    }

    const products = await Item.find(query).select('-__v');
    const category = await Category.findOne({ name: categoryName }).select('-__v');
    
    const response = {
      category: category?.name || categoryName,
      subcategory: subcategoryName || null,
      products: products,
      categoryImage: category?.imageUrl || null,
      subcategoryImage: subcategoryName 
        ? category?.subcategories?.find(sc => sc.name === subcategoryName)?.imageUrl 
        : null
    };

    if (products.length === 0) {
      return res.status(404).json({ 
        ...response,
        message: subcategoryName 
          ? `No products found in ${categoryName} > ${subcategoryName}`
          : `No products found in ${categoryName} category`
      });
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ 
      message: err.message,
      error: err 
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
    console.error('Image upload failed:', err);
    res.status(500).json({ 
      message: 'Image upload failed', 
      error: err.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});