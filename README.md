# 🌀 Diffusion Model

This repository contains a basic implementation of a **Diffusion Probabilistic Model** — a generative model capable of producing high-quality synthetic data by reversing a noise process over time.

## 🚀 Features

- Forward and reverse diffusion processes
- Sampling from a trained noise model
- Visualizations of diffusion steps
- Modular PyTorch-based implementation

## 🧠 What Are Diffusion Models?

Diffusion models work by gradually adding noise to data and learning how to reverse this process. They're used in cutting-edge generative models like **DALL·E 2**, **Imagen**, and **Stable Diffusion**.

## 🛠️ Installation

```bash
git clone https://github.com/Thufailahamed/Diffusion-Model.git
cd Diffusion-Model
pip install -r requirements.txt
```

## Download weights and tokenizer files:

Download vocab.json and merges.txt from https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/tree/main/tokenizer and save them in the data folder

Download v1-5-pruned-emaonly.ckpt from https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/tree/main and save it in the data folder
