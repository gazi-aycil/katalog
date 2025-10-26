import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Item from './models/Item.js';
import Category from './models/Category.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ✅ Arama endpoint’i
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ message: 'Arama terimi gerekli' });

    const regex = new RegExp(q, 'i');
    const results = await Item.find({
      $or: [
        { name: regex },
        { description: regex },
        { barcode: regex }
      ]
    }).limit(50);

    res.json({ results });
  } catch (err) {
    console.error('🔴 Arama hatası:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Kategori ve ürün uç noktaları
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/category/:id/products', async (req, res) => {
  try {
    const products = await Item.find({ category: req.params.id });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/subcategory/:id/products', async (req, res) => {
  try {
    const products = await Item.find({ subcategory: req.params.id });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/item/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Mongo bağlantısı
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server çalışıyor: ${PORT}`));
  })
  .catch(err => console.error(err));
