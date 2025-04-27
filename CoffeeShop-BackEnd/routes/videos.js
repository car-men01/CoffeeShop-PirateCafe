const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();

// Set up multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/videos');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, fileName);
  }
});

// Configure multer for large files
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videosDir = path.join(__dirname, '../public/videos');
    const thumbnailsDir = path.join(__dirname, '../public/videos/thumbnails');
    
    // Create directories if they don't exist
    await fs.ensureDir(videosDir);
    await fs.ensureDir(thumbnailsDir);
    
    // Read videos directory
    const videoFiles = fs.readdirSync(videosDir).filter(file => 
      file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
    );
    
    // Create video objects
    const videos = videoFiles.map((file, index) => {
      const filePath = path.join(videosDir, file);
      const stats = fs.statSync(filePath);
      const thumbnailFile = `${path.basename(file, path.extname(file))}.jpg`;
      
      return {
        id: index + 1,
        title: file.split('.').slice(0, -1).join('.'),
        url: `/videos/${file}`,
        thumbnail: fs.existsSync(path.join(thumbnailsDir, thumbnailFile)) 
          ? `/videos/thumbnails/${thumbnailFile}` 
          : `/videos/thumbnails/default_thumb.jpg`,
        size: `${Math.round(stats.size / (1024 * 1024))} MB`
      };
    });
    
    res.json(videos);
  } catch (err) {
    console.error('Error reading videos:', err);
    res.status(500).json({ error: 'Failed to retrieve videos' });
  }
});

// Upload new video
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoPath = req.file.path;
    const thumbnailsDir = path.join(__dirname, '../public/videos/thumbnails');
    const fileName = path.basename(req.file.filename, path.extname(req.file.filename));
    
    // Generate thumbnail
    let thumbnailUrl = '/videos/thumbnails/default_thumb.jpg';
    
    try {
      const thumbnailPath = await generateVideoThumbnail(
        videoPath, 
        thumbnailsDir,
        fileName
      );
      
      // Update thumbnail URL
      thumbnailUrl = `/videos/thumbnails/${fileName}.jpg`;
      console.log(`Thumbnail generated at: ${thumbnailPath}`);
    } catch (thumbnailErr) {
      console.error('Error generating thumbnail:', thumbnailErr);
      // Continue with default thumbnail
    }

    // Create response with video details
    const video = {
      id: Date.now(),
      title: req.body.title || fileName,
      url: `/videos/${req.file.filename}`,
      thumbnail: thumbnailUrl,
      size: `${Math.round(req.file.size / (1024 * 1024))} MB`
    };
    
    res.status(201).json(video);
  } catch (err) {
    console.error('Error uploading video:', err);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

module.exports = router;