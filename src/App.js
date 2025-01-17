import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [imageId, setImageId] = useState(null); // Unique ID for each request

  const handleGenerateImage = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setImage(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/start-generation",
        { prompt }
      );
      const newImageId = response.data.image_id;
      setImageId(newImageId);

      const eventSource = new EventSource(
        `http://127.0.0.1:5000/generate-progress/${newImageId}`
      );

      eventSource.onmessage = function (event) {
        if (event.data === "image") {
          eventSource.close();
          fetchImage(newImageId);
        } else {
          setProgress(parseFloat(event.data)); // Update progress
        }
      };

      eventSource.onerror = function () {
        setError("Error occurred during image generation.");
        eventSource.close();
      };
    } catch (error) {
      setError("An error occurred while generating the image.");
      setLoading(false);
    }
  };

  const fetchImage = async (imageId) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/get-image/${imageId}`,
        {
          responseType: "blob",
        }
      );

      if (response.status === 202) {
        setTimeout(() => fetchImage(imageId), 1000); // Retry fetching if not ready
      } else {
        const imageUrl = URL.createObjectURL(response.data);
        setImage(imageUrl);
        setLoading(false);
      }
    } catch (error) {
      setError("An error occurred while fetching the image.");
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">Image Generator</h1>
        <textarea
          className="prompt-input"
          placeholder="Enter a prompt to generate an image..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
        <button
          onClick={handleGenerateImage}
          disabled={loading}
          className="generate-btn"
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>

        {progress > 0 && progress < 100 && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {image && (
          <div>
            <img src={image} alt="Generated" className="generated-image" />
            <button onClick={handleGenerateImage} className="generate-btn">
              Generate New Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
