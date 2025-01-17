from flask import Flask, request, send_file, jsonify, Response
from flask_cors import CORS
import io
from PIL import Image
import torch
import model_loader
import pipeline
from transformers import CLIPTokenizer
import threading
import time
import uuid  # For unique image IDs

app = Flask(__name__)
CORS(app)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Load models and tokenizer once when the server starts
model_file = "../data/v1-5-pruned-emaonly.ckpt"
models = model_loader.preload_models_from_standard_weights(model_file, DEVICE)
tokenizer = CLIPTokenizer("../data/vocab.json", merges_file="../data/merges.txt")

# Dictionary to track progress & generated images
generation_status = {}

def generate_image_task(prompt, image_id):
    """Simulate image generation with progress updates."""
    uncond_prompt = ""
    do_cfg = True
    cfg_scale = 8
    strength = 0.9
    sampler = "ddpm"
    num_inference_steps = 50
    seed = 42

    # Reset progress
    generation_status[image_id] = {"progress": 0, "image": None}

    for step in range(1, num_inference_steps + 1):
        time.sleep(0.1)  # Simulate processing time
        generation_status[image_id]["progress"] = step / num_inference_steps * 100

    # Generate the image
    output_image = pipeline.generate(
        prompt=prompt,
        uncond_prompt=uncond_prompt,
        input_image=None,
        strength=strength,
        do_cfg=do_cfg,
        cfg_scale=cfg_scale,
        sampler_name=sampler,
        n_inference_steps=num_inference_steps,
        seed=seed,
        models=models,
        device=DEVICE,
        idle_device="cpu",
        tokenizer=tokenizer,
    )

    # Convert image to bytes
    img_byte_arr = io.BytesIO()
    output_pil_image = Image.fromarray(output_image)
    output_pil_image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)

    # Store the generated image
    generation_status[image_id]["image"] = img_byte_arr.getvalue()

@app.route('/start-generation', methods=['POST'])
def start_generation():
    """Start a new image generation process."""
    data = request.json
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    image_id = str(uuid.uuid4())  # Unique image ID
    threading.Thread(target=generate_image_task, args=(prompt, image_id)).start()

    return jsonify({"image_id": image_id}), 202

@app.route('/generate-progress/<image_id>', methods=['GET'])
def generate_progress(image_id):
    """Send progress updates using Server-Sent Events (SSE)."""
    def progress_stream():
        while generation_status.get(image_id, {}).get("progress", 0) < 100:
            yield f"data: {generation_status.get(image_id, {}).get('progress', 0)}\n\n"
            time.sleep(0.1)
        yield f"data: image\n\n"

    return Response(progress_stream(), mimetype="text/event-stream")

@app.route('/get-image/<image_id>', methods=['GET'])
def get_image(image_id):
    """Retrieve the generated image."""
    if generation_status.get(image_id, {}).get("image"):
        return send_file(io.BytesIO(generation_status[image_id]["image"]), mimetype="image/jpeg")
    return jsonify({"status": "image generation in progress"}), 202

if __name__ == '__main__':
    app.run(debug=True)
