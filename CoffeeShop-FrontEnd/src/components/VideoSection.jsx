import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaDownload, FaUpload } from "react-icons/fa";
import { API_URL } from "../config";
import '../styles/VideoSection.css';

const VideoSection = () => {
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videosPerPage = 2;
  
  useEffect(() => {
    // Fetch videos from server when component mounts
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_URL}/videos`);
      // Ensure all videos have absolute URLs
      const processedVideos = response.data.map(video => ({
        ...video,
        url: video.url.startsWith("http") ? 
          video.url : `${API_URL}${video.url}`,
        thumbnail: video.thumbnail.startsWith("http") ? 
          video.thumbnail : `${API_URL}${video.thumbnail}`
      }));
      setVideos(processedVideos);
      console.log("Fetched videos:", processedVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      // If API fails, use demo videos with absolute URLs
      setVideos([
        { 
          id: 1, 
          title: "Morning at Pirate Café", 
          url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
          thumbnail: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
          size: "675 MB" 
        },
        { 
          id: 2, 
          title: "Coffee Making Process", 
          url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
          thumbnail: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
          size: "710 MB" 
        },
        { 
          id: 3, 
          title: "Evening Ambience", 
          url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
          thumbnail: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
          size: "620 MB" 
        }
      ]);
    }
  };
  
  const handleDelete = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      console.log("Attempting to delete video with ID:", videoId);
      
      // Encode the videoId to handle special characters like slashes
      const encodedVideoId = encodeURIComponent(videoId);
      
      // Make sure API_URL doesn't have a trailing slash
      const apiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      
      await axios.delete(`${apiUrl}/videos/${encodedVideoId}`);
      setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId));
      alert("Video deleted successfully.");
    } catch (err) {
      console.error("Error deleting video:", err);
      alert(`Failed to delete video: ${err.message || "Unknown error"}. Please try again.`);
    }
  };

  const handleDownload = (videoUrl, fileName) => {
    // Create an anchor element and trigger download
    const anchor = document.createElement('a');
    anchor.href = videoUrl;
    anchor.download = fileName || 'pirate_cafe_video.mp4';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Check if file is a video
  if (!file.type.includes('video/')) {
    alert('Please select a video file.');
    return;
  }

  // Check file size (100MB for Cloudinary free tier)
  if (file.size > 100 * 1024 * 1024) {
    alert('File size exceeds 100MB. Please select a smaller file.');
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);

  // Use FormData to send the file
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', file.name.split('.')[0]); // Use filename without extension as title

  try {
    // Simulate progress since actual progress from Cloudinary isn't available directly
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);

    // Send to backend which will upload to Cloudinary
    const response = await axios.post(`${API_URL}/videos/upload`, formData);
    clearInterval(progressInterval);
    setUploadProgress(100);

    // Add new video to the list
    setVideos(prevVideos => [response.data, ...prevVideos]);
    
    // Reset form and state
    setIsUploading(false);
    event.target.value = '';
  } catch (err) {
    console.error('Error uploading video:', err);
    setIsUploading(false);
    setUploadProgress(0);
    alert('Failed to upload video. Please try again.');
  }
};

  // Pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = videos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  return (
    <section className="video-section">
      <div className="video-section-header">
        <h2 className="video-section-title">Cafe Video Shots</h2>
        <label className="upload-button">
          <FaUpload /> Upload Video
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>Uploading... {uploadProgress}%</p>
        </div>
      )}

      <div className="video-grid">
        {currentVideos.length > 0 ? (
          currentVideos.map(video => (
            <div key={video.id} className="video-card">
              <div className="video-thumbnail">
                <video 
                  src={video.url} 
                  poster={video.thumbnail}
                  controls
                  preload="metadata"
                  width="100%"
                  height="auto"
                  onError={(e) => {
                    console.error("Video error:", e);
                    e.target.onerror = null;
                    e.target.poster = "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg";
                  }}
                ></video>
              </div>              <div className="video-info">
                <p>Size: {video.size}</p>
                <div className="video-actions">
                  <button 
                    className="download-button"
                    onClick={() => handleDownload(video.url, `${video.title}.mp4`)}
                  >
                    <FaDownload /> Download
                  </button>
                  <button 
                    className="delete-video-button"
                    onClick={() => handleDelete(video.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-videos-message">
            <p>No videos available. Upload some videos to get started!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="video-pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {[...Array(totalPages)].map((_, index) => (
              <button 
                key={index} 
                onClick={() => setCurrentPage(index + 1)}
                className={currentPage === index + 1 ? 'active' : ''}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default VideoSection;