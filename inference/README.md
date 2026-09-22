# Skinergy burn-degree inference service

A small FastAPI service that loads the MobileNetV2 Keras model (originally
`public/MobileNetV2_model.keras.rar`, repackaged here as
`model/burn_model.keras`) and classifies burn photos by degree.

## Run it

```
npm run inference
```

This starts the service on `http://127.0.0.1:8000`. The Next.js app's
`/api/classify` route calls it automatically when a photo is provided in the
scan flow — if the service isn't running, the app falls back to simulated
classification instead of failing, so `npm run dev` works fine on its own.

## Setup (already done once, documented for reproducibility)

```
python -m venv inference/.venv
inference/.venv/Scripts/pip install -r inference/requirements.txt
```

## Open assumptions — verify these

No `labels.txt` or training script shipped with the model, so two things
were inferred rather than confirmed:

1. **Class order**: assumed alphabetical/ordinal — output index 0 = 1st
   Degree, 1 = 2nd Degree, 2 = 3rd Degree. If real predictions look
   inverted or mismatched, swap the order in `CLASS_LABELS` in `app.py`.
2. **Preprocessing**: the model's own layers include a Keras `Normalization`
   layer right after the input, so raw 0–255 pixel values are sent as-is
   (no manual rescale). If results look off, this is the first thing to
   double-check against however the model was originally trained.

Input size (153×111, from the model's own `InputLayer`) is not a guess —
that's read directly from the saved model config.
