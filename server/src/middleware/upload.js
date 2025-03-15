const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs').promises;

const UPLOAD_DIR = path.join(__dirname, '../../uploads/users');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Use memory storage instead of disk to avoid duplicate files
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only .png, .jpg and .jpeg formats are allowed!'), false);
    }
    cb(null, true);
  }
});

// Process and save image
async function processAndSaveImage(file, userId) {
  await ensureUploadDir();
  
  const filename = `${userId}-${Date.now()}.jpg`;
  const outputPath = path.join(UPLOAD_DIR, filename);

  try {
    await sharp(file.buffer)
      .resize(500, 500, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return `/uploads/users/${filename}`;
  } catch (error) {
    // If there's an error, ensure we clean up any partially written file
    try {
      await fs.unlink(outputPath);
    } catch (unlinkError) {
      // Ignore unlink errors
    }
    throw error;
  }
}

// Cleanup old images
async function cleanupOldImages(urls) {
  for (const url of urls) {
    try {
      if (!url) continue;
      const filepath = path.join(__dirname, '../..', url);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }
}

module.exports = {
  upload,
  processAndSaveImage,
  cleanupOldImages,
  UPLOAD_DIR
}; 