const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const ImageKit = require('imagekit');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5002;

// 🔹 ImageKit config
const imagekit = new ImageKit({
  publicKey: 'public_UjYJw52KefpFNDwLgSX84uFPlnw=',
  privateKey: 'private_Ah0UG/lM0+LaTvdurbXhnUy2ePk=',
  urlEndpoint: 'https://ik.imagekit.io/4t0zibpdh/'
});

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB bağlantısı
mongoose.connect('mongodb+srv://catalog-app:vlVAbyhQsAh2lUgS@catalog-app.v0tfl.mongodb.net/ravinzo?retryWrites=true&w=majority&appName=catalog-app&')
  .then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('🔴 MongoDB error:', err));

// 🔹 Şemalar
const subcategorySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  name: String,
  imageUrl: String,
  subcategories: [mongoose.Schema.Types.Mixed]
});

const categorySchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  subcategories: [subcategorySchema]
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  barcode: String,
  name: String,
  description: String,
  category: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: String,
  subcategoryId: { type: mongoose.Schema.Types.ObjectId },
  price: mongoose.Schema.Types.Mixed,
  specs: [String],
  images: [String],
}, { timestamps: true });

const featureSchema = new mongoose.Schema({
  name: String,
  description: String,
  type: { type: String, enum: ['usage_area', 'product_measurements', 'product_properties'] },
  hasValue: Boolean,
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Item = mongoose.model('Item', itemSchema);
const Feature = mongoose.model('Feature', featureSchema);

//
// 🔍 YENİ ARAMA ENDPOINTİ
//
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ message: 'Arama terimi gerekli' });

    const regex = new RegExp(query, 'i');
    const results = await Item.find({
      $or: [
        { name: regex },
        { description: regex },
        { barcode: regex }
      ]
    }).limit(50);

    res.json({
      query,
      count: results.length,
      results
    });
  } catch (err) {
    console.error('🔴 Arama hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

//
// 🔹 Kategori & Ürün CRUD
//
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// Sağlık kontrolü
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/search?q=örnek`);
});
