import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("txt2img");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [strength, setStrength] = useState(1.0);
  const [model, setModel] = useState("default");

  const handleGenerateImage = async () => {
    setLoading(true);
    setError(null);
    setImage(null);
    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("mode", mode);
      formData.append("model", model);
      if (mode === "img2img" && selectedImage) {
        formData.append("image", selectedImage);
        formData.append("strength", strength);
      }
      const response = await axios.post(
        "http://127.0.0.1:5000/start-generation",
        formData
      );
      if (response.data.status === "success") {
        setImage(response.data.image_url);
      } else {
        setError(response.data.message || "Image generation failed.");
      }
    } catch (error) {
      setError("An error occurred while generating the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveImage = () => {
    if (image) {
      const link = document.createElement("a");
      link.href = image;
      link.download = "generated_image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <img src="/prism.jpg" alt="PRISM Logo" className="prism-logo" />
        <h1 className="header-title">AI Image Generator</h1>
      </header>

      <p className="sub-text">Create stunning visuals with AI</p>

      <motion.div
        className="container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.textarea
          className="prompt-input"
          placeholder="Describe what you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></motion.textarea>

        {/* Model Selection */}
        <div className="selection-container">
          <label>Model:</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="default">Default Model</option>
            <option value="inkpunk">Inkpunk Model</option>
          </select>
          <p>Selected Model: {model}</p>
        </div>

        {/* Mode Selection */}
        <div className="selection-container">
          <label>Mode:</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="txt2img">Text to Image</option>
            <option value="img2img">Image to Image</option>
          </select>
          <p>Selected Mode: {mode}</p>
        </div>

        {mode === "img2img" && (
          <div className="image-upload">
            <label htmlFor="upload" className="upload-btn">
              Upload Image
            </label>
            <input
              id="upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* Center Uploaded Image */}
        {mode === "img2img" && selectedImage && (
          <div className="selected-image-container">
            <img
              src={previewImage}
              alt="Selected for img2img"
              className="selected-image"
            />
          </div>
        )}

        <button
          onClick={handleGenerateImage}
          disabled={loading}
          className="generate-btn"
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>

        {error && <div className="error">{error}</div>}

        {image && (
          <div className="generated-container">
            <img src={image} alt="Generated" className="generated-image" />
            <button onClick={handleSaveImage} className="save-btn">
              Save Image
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default App;
