const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads';
        // Klasör yoksa oluştur
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
});

// Örnek veri
let items = [
  { id: 1, name: 'Ürün 1', description: 'Açıklama 1', price: 100 },
  { id: 2, name: 'Ürün 2', description: 'Açıklama 2', price: 200 },
  { id: 3, name: 'Ürün 3', description: 'Açıklama 3', price: 300 }
];

// Tüm öğeleri getir
router.get('/items', protect, (req, res) => {
  res.json(items);
});

// ID'ye göre öğe getir
router.get('/items/:id', protect, (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(item => item.id === id);
  
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: 'Öğe bulunamadı' });
  }
});

// Yeni öğe ekle
router.post('/items', protect, admin, (req, res) => {
  const { name, description, price } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ message: 'İsim ve açıklama gereklidir' });
  }
  
  const newItem = {
    id: items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1,
    name,
    description,
    price: price || 0
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
});

// Öğe güncelle
router.put('/items/:id', protect, admin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = items.findIndex(item => item.id === id);
  
  if (index !== -1) {
    const { name, description, price } = req.body;
    items[index] = { 
      id, 
      name: name || items[index].name, 
      description: description || items[index].description,
      price: price !== undefined ? price : items[index].price
    };
    res.json(items[index]);
  } else {
    res.status(404).json({ message: 'Öğe bulunamadı' });
  }
});

// Öğe sil
router.delete('/items/:id', protect, admin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = items.findIndex(item => item.id === id);
  
  if (index !== -1) {
    const deletedItem = items[index];
    items = items.filter(item => item.id !== id);
    res.json(deletedItem);
  } else {
    res.status(404).json({ message: 'Öğe bulunamadı' });
  }
});

// *** RESİM API ROTALARI ***

// Tüm resimleri getir
router.get('/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ order: 1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resim sırasını güncelle
router.put('/images/:id/order', protect, admin, async (req, res) => {
    try {
        const { direction } = req.body; // 'up' veya 'down'
        
        // Tüm resimleri sıraya göre getir
        const images = await Image.find().sort({ order: 1 });
        
        // Mevcut resmin indexini bul
        const currentIndex = images.findIndex(img => img._id.toString() === req.params.id);
        if (currentIndex === -1) {
            return res.status(404).json({ message: 'Resim bulunamadı' });
        }

        // Hedef indexi belirle
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        // Index sınırlarını kontrol et
        if (targetIndex < 0 || targetIndex >= images.length) {
            return res.status(400).json({ message: 'Geçersiz sıralama işlemi' });
        }

        // Sıraları değiştir
        const currentImage = images[currentIndex];
        const targetImage = images[targetIndex];
        
        // Sıraları güncelle
        await Image.findByIdAndUpdate(currentImage._id, { order: targetImage.order });
        await Image.findByIdAndUpdate(targetImage._id, { order: currentImage.order });

        // Güncellenmiş listeyi getir ve gönder
        const updatedImages = await Image.find().sort({ order: 1 });
        res.json({ message: 'Sıralama güncellendi', images: updatedImages });
    } catch (error) {
        console.error('Sıralama hatası:', error);
        res.status(500).json({ message: error.message });
    }
});

// Resimleri yeniden sırala
router.put('/images/reorder', protect, admin, async (req, res) => {
    try {
        const { orders } = req.body;
        
        // Tüm resimleri sıraya göre getir
        const images = await Image.find().sort({ order: 1 });
        
        // Her resmin sırasını index + 1 olarak güncelle
        const updates = orders.map((item, index) => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: index + 1 }
            }
        }));
        
        // Toplu güncelleme yap
        await Image.bulkWrite(updates);
        
        // Güncellenmiş resim listesini döndür
        const updatedImages = await Image.find().sort({ order: 1 });
        res.json({ message: 'Sıralama güncellendi', images: updatedImages });
    } catch (error) {
        console.error('Sıralama hatası:', error);
        res.status(500).json({ message: error.message });
    }
});

// Yeni resim ekle (URL veya dosya yükleme)
router.post('/images', protect, admin, upload.single('image'), async (req, res) => {
    try {
        let url;
        
        // Dosya yüklendiyse
        if (req.file) {
            // Tam URL oluştur - backend URL'sini kullanarak
            const backendUrl = process.env.BACKEND_URL || 'https://slider-backend.onrender.com';
            url = `${backendUrl}/uploads/${req.file.filename}`;
            console.log('Oluşturulan resim URL:', url); // Debug için log
        } 
        // URL gönderildiyse
        else if (req.body.url) {
            url = req.body.url;
        } else {
            return res.status(400).json({ message: 'Resim dosyası veya URL\'si gereklidir' });
        }
        
        // Mevcut resimleri getir
        const images = await Image.find().sort({ order: -1 });
        
        // Yeni resim için sıra numarası belirle
        const newOrder = images.length > 0 ? (images[0].order || 0) + 1 : 1;
        
        // Yeni resim oluştur
        const newImage = new Image({
            url,
            order: newOrder
        });
        
        // Yeni resmi kaydet
        const savedImage = await newImage.save();
        
        // Güncellenmiş resim listesini döndür
        const updatedImages = await Image.find().sort({ order: 1 });
        res.status(201).json({ message: 'Resim eklendi', image: savedImage, images: updatedImages });
    } catch (error) {
        // Hata durumunda yüklenen dosyayı sil
        if (req.file) {
            fs.unlinkSync(path.join('public', 'uploads', req.file.filename));
        }
        res.status(500).json({ message: error.message });
    }
});

// Resim silme işleminden sonra sıraları düzelt
router.delete('/images/:id', protect, admin, async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        
        if (!image) {
            return res.status(404).json({ message: 'Resim bulunamadı' });
        }
        
        // Eğer resim lokalde yüklüyse, dosyayı sil
        if (image.url.startsWith('/uploads/')) {
            const filePath = path.join('public', image.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        // Resmi sil
        await Image.findByIdAndDelete(req.params.id);
        
        // Kalan resimleri sıraya göre getir
        const remainingImages = await Image.find().sort({ order: 1 });
        
        // Sıra numaralarını yeniden düzenle
        const updates = remainingImages.map((img, index) => ({
            updateOne: {
                filter: { _id: img._id },
                update: { order: index + 1 }
            }
        }));
        
        if (updates.length > 0) {
            await Image.bulkWrite(updates);
        }
        
        res.json({ 
            message: 'Resim başarıyla silindi',
            images: await Image.find().sort({ order: 1 })
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 