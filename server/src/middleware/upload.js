const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs').promises;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Process and save image
async function processAndSaveImage(file, folder) {
  const filename = `${uuidv4()}${path.extname(file.originalname)}`;
  const filepath = path.join(__dirname, '..', 'uploads', folder, filename);

  // Process image with sharp
  await sharp(file.buffer)
    .resize(800, 800, { // Max dimensions
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 }) // Convert to JPEG and compress
    .toFile(filepath);

  return {
    filename,
    url: `/uploads/${folder}/${filename}`
  };
}

// Cleanup old images
async function cleanupOldImages(urls) {
  for (const url of urls) {
    try {
      const filepath = path.join(__dirname, '..', url);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }
}

module.exports = {
  upload,
  processAndSaveImage,
  cleanupOldImages
}; 