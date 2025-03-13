const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const { protect, admin } = require('../middleware/auth');

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

// Yeni resim ekle
router.post('/images', protect, admin, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ message: 'Resim URL\'si gereklidir' });
        }
        
        // Mevcut resimleri getir ve en yüksek sıra numarasını bul
        const images = await Image.find().sort({ order: -1 });
        const maxOrder = images.length > 0 ? images[0].order : -1;
        
        // Yeni resim oluştur
        const newImage = new Image({
            url,
            order: maxOrder + 1 // En son resimden bir fazla sıra numarası ver
        });
        
        // Maksimum 6 resim olacak şekilde kontrol et
        if (images.length >= 6) {
            // En eski resmi bul ve sil
            const oldestImage = await Image.findOne().sort({ createdAt: 1 });
            if (oldestImage) {
                await Image.findByIdAndDelete(oldestImage._id);
            }
        }
        
        // Yeni resmi kaydet
        const savedImage = await newImage.save();
        
        // Güncellenmiş resim listesini döndür
        const updatedImages = await Image.find().sort({ order: 1 });
        res.status(201).json({ message: 'Resim eklendi', image: savedImage, images: updatedImages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Resim sil
router.delete('/images/:id', protect, admin, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Resim bulunamadı' });
    }
    
    await Image.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resim başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resimleri yeniden sırala
router.put('/images/reorder', protect, admin, async (req, res) => {
    try {
        const { orders } = req.body;
        
        // Her bir resmin sırasını güncelle
        for (const item of orders) {
            await Image.findByIdAndUpdate(item.id, { order: item.order });
        }
        
        // Güncellenmiş resim listesini döndür
        const updatedImages = await Image.find().sort({ order: 1 });
        res.json({ message: 'Sıralama güncellendi', images: updatedImages });
    } catch (error) {
        console.error('Sıralama hatası:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 