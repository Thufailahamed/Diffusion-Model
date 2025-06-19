import os
import uuid
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import torch
from transformers import CLIPTokenizer
import model_loader
import pipeline
import random


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

MODEL_PATHS = {
    "default": "../data/v1-5-pruned-emaonly.ckpt",
    "inkpunk": "../data/inkpunk-diffusion-v1.ckpt",
}

def get_device(user_choice):
    if user_choice == "cuda" and torch.cuda.is_available():
        return "cuda"
    return "cpu"

@app.route("/start-generation", methods=["POST"])
def generate_image():
    try:
        prompt = request.form.get("prompt", "").strip()
        mode = request.form.get("mode", "txt2img").strip()
        model_choice = request.form.get("model", "default").strip()
        strength = float(request.form.get("strength", "1.0"))
        device_choice = request.form.get("device", "cpu")
        device = get_device(device_choice)

        if not prompt:
            return jsonify({"status": "error", "message": "Prompt cannot be empty"}), 400

        if model_choice not in MODEL_PATHS:
            model_choice = "default"  
        model_file = MODEL_PATHS[model_choice]

        models = model_loader.preload_models_from_standard_weights(model_file, device)

        input_image = None
        if mode == "img2img":
            image_file = request.files.get("image")
            if image_file:
                image_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.jpg")
                image_file.save(image_path)
                input_image = Image.open(image_path)

        output_image = pipeline.generate(
            prompt=prompt,
            uncond_prompt="",
            input_image=input_image,
            strength=0.8,
            do_cfg=True,
            cfg_scale=8,
            sampler_name="ddpm",
            n_inference_steps=24,
            seed = random.randint(0, 2**32 - 1),
            models=models,
            device="cuda" if torch.cuda.is_available() else "cpu",
            idle_device="cpu",
            tokenizer=CLIPTokenizer.from_pretrained("openai/clip-vit-base-patch32"),
        )

        output_filename = f"{uuid.uuid4()}.jpg"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        Image.fromarray(output_image).save(output_path, format="JPEG")

        return jsonify({"status": "success", "image_url": f"http://127.0.0.1:5000/get-image/{output_filename}"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/get-image/<filename>")
def get_generated_image(filename):
    file_path = os.path.join(OUTPUT_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype="image/jpeg")
    return jsonify({"status": "error", "message": "Image not found"}), 404


if __name__ == "__main__":
    app.run(debug=False)