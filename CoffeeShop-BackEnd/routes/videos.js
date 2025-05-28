const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const router = express.Router();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up Cloudinary storage for videos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pirate-cafe/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm'],
    transformation: [{ quality: 'auto' }]
  }
});

// Configure multer with Cloudinary storage
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for free tier
});

// Get all videos
router.get('/', async (req, res) => {
  try {
    // Fetch videos from Cloudinary instead of local directory
    const result = await cloudinary.search
      .expression('folder:pirate-cafe/videos')
      .sort_by('created_at', 'desc')
      .max_results(30)
      .execute();
    
    const videos = result.resources.map((resource) => {
      return {
        id: resource.public_id,
        title: resource.filename || resource.public_id.split('/').pop(),
        url: resource.secure_url,
        thumbnail: cloudinary.url(resource.public_id, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [{ width: 320, height: 180, crop: 'fill' }]
        }),
        size: `${Math.round(resource.bytes / (1024 * 1024))} MB`
      };
    });
    
    res.json(videos);
  } catch (err) {
    console.error('Error fetching videos from Cloudinary:', err);
    res.status(500).json({ error: 'Failed to retrieve videos' });
  }
});

// Upload new video
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Cloudinary automatically generates thumbnails for videos
    const thumbnailUrl = cloudinary.url(req.file.filename, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 320, height: 180, crop: 'fill' }]
    });

    // Create response with video details
    const video = {
      id: req.file.filename,
      title: req.body.title || req.file.originalname.split('.')[0],
      url: req.file.path, // Cloudinary URL
      thumbnail: thumbnailUrl,
      size: `${Math.round(req.file.size / (1024 * 1024))} MB`
    };
    
    res.status(201).json(video);
  } catch (err) {
    console.error('Error uploading video to Cloudinary:', err);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Delete video endpoint
router.delete('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Delete the video from Cloudinary
    await cloudinary.uploader.destroy(videoId, { resource_type: 'video' });
    
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;