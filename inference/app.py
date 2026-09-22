"""
Skinergy burn-degree inference service.

Loads the MobileNetV2-based Keras 3 classifier (provided in
public/MobileNetV2_model.keras.rar, repackaged here as model/burn_model.keras)
and exposes it over HTTP so the Next.js app can call it without needing a
Python runtime of its own.

ASSUMPTIONS (no labels.txt or training script was provided alongside the
model — verify these against how the model was actually trained):
  - Output class order is alphabetical/ordinal: index 0 = 1st Degree,
    index 1 = 2nd Degree, index 2 = 3rd Degree. If predictions look wrong
    (e.g. severe burns classified as 1st degree), swap this order first.
  - The model expects raw pixel values in [0, 255] as float32 — no manual
    rescaling is applied here because the saved model already contains a
    Keras `Normalization` layer (with its own learned mean/variance) right
    after the input layer, so it does its own preprocessing internally.
  - Input size is (153 height x 111 width x 3), taken directly from the
    model's InputLayer batch_shape.
"""

from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

import keras

MODEL_PATH = Path(__file__).parent / "model" / "burn_model.keras"
INPUT_HEIGHT = 153
INPUT_WIDTH = 111

CLASS_LABELS = [
    {"degree": "1st Degree", "thickness": "Superficial"},
    {"degree": "2nd Degree", "thickness": "Partial Thickness"},
    {"degree": "3rd Degree", "thickness": "Full Thickness"},
]

app = FastAPI(title="Skinergy Burn Classifier")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


@app.on_event("startup")
def load_model():
    global model
    model = keras.models.load_model(MODEL_PATH)
    # Warm up so the first real request isn't slow.
    dummy = np.zeros((1, INPUT_HEIGHT, INPUT_WIDTH, 3), dtype=np.float32)
    model.predict(dummy, verbose=0)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        image = Image.open(file.file).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image file")

    image = image.resize((INPUT_WIDTH, INPUT_HEIGHT))
    arr = np.asarray(image, dtype=np.float32)
    batch = np.expand_dims(arr, axis=0)

    predictions = model.predict(batch, verbose=0)[0]
    top_idx = int(np.argmax(predictions))
    label = CLASS_LABELS[top_idx]

    return {
        "degree": label["degree"],
        "thickness": label["thickness"],
        "confidence": round(float(predictions[top_idx]) * 100, 1),
        "probabilities": {
            CLASS_LABELS[i]["degree"]: round(float(p) * 100, 1)
            for i, p in enumerate(predictions)
        },
    }
