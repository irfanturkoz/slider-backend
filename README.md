# 0danbaşla Backend

Bu proje, 0danbaşla uygulaması için RESTful API backend uygulamasıdır.

## Kurulum

1. MongoDB'yi kurun:
   - [MongoDB'yi indirin ve kurun](https://www.mongodb.com/try/download/community)
   - Veya [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) üzerinde ücretsiz bir hesap oluşturun

2. `.env` dosyasını düzenleyin:
   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/0danbas
   ```
   
   MongoDB Atlas kullanıyorsanız, MONGODB_URI'yi Atlas'tan aldığınız bağlantı dizesiyle değiştirin.

3. Gerekli paketleri yükleyin:
   ```
   npm install
   ```

4. Uygulamayı başlatın:
   ```
   npm start
   ```

   Geliştirme modunda çalıştırmak için:
   ```
   npm run dev
   ```

## API Endpointleri

### Ürünler
- `GET /api/items`: Tüm öğeleri listeler
- `GET /api/items/:id`: Belirli bir öğeyi getirir
- `POST /api/items`: Yeni bir öğe ekler
- `PUT /api/items/:id`: Bir öğeyi günceller
- `DELETE /api/items/:id`: Bir öğeyi siler

### Resimler
- `GET /api/images`: Tüm resimleri listeler
- `POST /api/images`: Yeni bir resim ekler
- `DELETE /api/images/:id`: Bir resmi siler

## Teknolojiler

- Node.js
- Express
- MongoDB
- Mongoose
- CORS
- dotenv

## Klasör Yapısı

```
backend/
  ├── config/           # Yapılandırma dosyaları
  │   └── db.js         # MongoDB bağlantısı
  ├── models/           # Veritabanı modelleri
  │   └── Image.js      # Resim modeli
  ├── node_modules/     # Bağımlılıklar
  ├── public/           # Statik dosyalar
  ├── routes/           # API rotaları
  │   └── api.js        # API endpoint'leri
  ├── .env              # Çevre değişkenleri
  ├── package.json      # Proje bağımlılıkları
  ├── README.md         # Proje dokümantasyonu
  └── server.js         # Ana uygulama dosyası
``` 