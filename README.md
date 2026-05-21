# WordFormatter – Word Dosya Birleştirici

İki adet Microsoft Word (.docx) dosyasının biçimlendirme ve içeriklerini birleştiren modern full-stack web uygulaması.

## 🏗️ Mimari

- **Backend**: Python + FastAPI + python-docx
- **Frontend**: Vite + TypeScript + Tailwind CSS v4
- **Haberleşme**: Axios ile multipart dosya transferi

## Uyarılar
- **CORS:** Geliştirme (development) ortamında kolaylık olması açısından `backend/main.py` dosyasında `allow_origins=["*"]` ayarı yapılmıştır. Bu durum production ortamında güvenlik riski oluşturabilir. Canlıya (Production) geçerken sadece belirli frontend URL'lerine izin verilmelidir.

## 🚀 Kurulum ve Çalıştırma

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend varsayılan olarak `http://localhost:5173` adresinde çalışır ve API isteklerini `http://localhost:8000` adresine proxy'ler.

## 📋 Kullanım

1. Sol taraftaki **"Biçimlendirme Şablonu"** alanına format şablonu Word dosyasını sürükleyin
2. Diğer alana **"Yazı İçeriği"** Word dosyasını sürükleyin
3. **"Birleştir"** butonuna tıklayın
4. Birleştirilmiş dosya otomatik olarak indirilecektir

## ⚙️ Birleştirme Mantığı

- Şablon dosyasının her paragrafının biçimlendirmesi (font, boyut, renk, kalın/italik, hizalama, satır aralığı) korunur
- İçerik dosyasının her paragrafının ham metni, sırasıyla şablon paragraflarına yazılır
- Şablon paragrafı > İçerik paragrafı ise fazla paragraflar boş kalır
- İçerik paragrafı > Şablon paragrafı ise son şablon stili kullanılır

## 🔮 Gelecek: AI Entegrasyonu

Sistem, AI pipeline entegrasyonuna açık şekilde tasarlanmıştır. `merger.py` içindeki dataclass yapıları ve `main.py` içindeki placeholder endpoint'ler bu amaçla hazırlanmıştır.
