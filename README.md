# House Price Prediction — End-to-End ML Web App

Predicts the price of a residential property in India from its listing details
(location, area, floor, furnishing, etc.), using a Random Forest model trained
on ~187k real Kaggle listings, served through a FastAPI backend and a React +
TypeScript frontend.

## Overview

| | |
|---|---|
| **Dataset** | [House Price by Juhi Bhojani](https://www.kaggle.com/datasets/juhibhojani/house-price) (Kaggle, ~187k rows) |
| **Model** | Random Forest Regressor (chosen over Linear Regression / Gradient Boosting — see the notebook §2.5) |
| **Backend** | FastAPI, serving the model behind `/predict` and `/metadata` |
| **Frontend** | React + TypeScript (Vite), a form → result page flow |

## Architecture

```
                    ┌──────────────────────────┐
                    │   notebooks/              │
                    │   house_price_model.ipynb │   1. clean data
                    │                            │   2. train + compare models
                    │   Kaggle CSV ──────────────┼──▶ 3. export:
                    └──────────────────────────┘        house_price.pkl
                                                          metadata.json
                                                          locations.json
                                                              │
                                                              ▼
┌───────────────────────┐   HTTP (JSON)   ┌──────────────────────────────┐
│  frontend/ (React+TS)  │ ───────────────▶│  backend/ (FastAPI)           │
│                        │                  │                                │
│  PredictionForm.tsx    │  POST /predict   │  api/routes/prediction.py     │
│   ── fetch metadata    │ ◀─────────────── │   → services/preprocessing.py │
│   ── validate + submit │  GET  /metadata  │   → services/inference.py     │
│  ResultPage.tsx        │  GET  /health    │     (loads models/house_price.pkl
│   ── show price        │                  │      once, at startup)        │
└───────────────────────┘                  └──────────────────────────────┘
```

## Tech stack

- **Data / ML**: pandas, NumPy, scikit-learn (`ColumnTransformer` + `Pipeline`), matplotlib, seaborn, Jupyter
- **Backend**: FastAPI, Pydantic v2, pydantic-settings, uvicorn, joblib, pytest, httpx
- **Frontend**: React 18, TypeScript, Vite, React Router
- **Ops**: Docker, `.env`-based configuration

## Project structure

```
house-price-project/
├── notebooks/
│   ├── house_price_model.ipynb   # data cleaning → EDA → training → evaluation → export (canonical deliverable)
│   └── data/                     # house_prices.csv goes here (gitignored — see "Get the dataset" below)
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, model loaded at startup (lifespan)
│   │   ├── api/routes/prediction.py   # GET /health, GET /metadata, POST /predict
│   │   ├── core/config.py             # Settings from .env (pydantic-settings)
│   │   ├── schemas/prediction.py      # PredictionRequest / PredictionResponse
│   │   ├── services/
│   │   │   ├── preprocessing.py       # request -> one-row DataFrame
│   │   │   └── inference.py           # loads house_price.pkl, runs predict()
│   │   └── utils/logging_config.py
│   ├── scripts/train_model.py    # headless equivalent of the notebook (optional, for CI/automation)
│   ├── models/house_price.pkl    # ← copy here after running the notebook
│   ├── tests/test_prediction.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
└── frontend/src/
    ├── api/predictionClient.ts   # fetch wrapper, base URL from VITE_API_BASE_URL
    ├── components/PredictionForm.tsx
    ├── pages/{HomePage,ResultPage,NotFoundPage}.tsx
    ├── types/prediction.ts       # TS types mirroring the backend schema
    └── App.tsx                   # routes: / , /result , * (404)
```

## Get the dataset

```bash
pip install kaggle
# Kaggle → Settings → API → "Create New Token", save kaggle.json to ~/.kaggle/ (or C:\Users\<you>\.kaggle\)
kaggle datasets download -d juhibhojani/house-price -p notebooks/data --unzip
```

(Or download manually from the [dataset page](https://www.kaggle.com/datasets/juhibhojani/house-price) and
unzip `house_prices.csv` into `notebooks/data/`.)

## 1. Run the notebook

```bash
cd notebooks
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install jupyter pandas numpy scikit-learn matplotlib seaborn joblib
jupyter notebook house_price_model.ipynb
```

Run all cells top to bottom (Kernel → Restart & Run All). It writes `house_price.pkl`,
`metadata.json` and `locations.json` into `notebooks/`. Copy them into the backend:

```bash
cp house_price.pkl metadata.json locations.json ../backend/models/
```

## 2. Run the backend

```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload --port 8000
pytest   # 6 tests: health, metadata, happy-path predict, 2× invalid-input 422, model-not-loaded 503
```

Open `http://127.0.0.1:8000/docs` for interactive Swagger UI.

### Backend environment variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `House Price Prediction API` | Shown in `/docs` |
| `APP_VERSION` | `1.0.0` | Shown in `/docs` |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `MODEL_PATH` | `models/house_price.pkl` | Path to the trained pipeline |
| `METADATA_PATH` | `models/metadata.json` | Path to the exported category/range metadata |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed frontend origins |

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env

npm run dev      # http://127.0.0.1:5173
npm run build    # production build, output in dist/
```

### Frontend environment variables (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Full base URL of the backend — never hard-code this in components |

## API reference

### `GET /health`

```bash
curl http://localhost:8000/health
```
```json
{ "status": "ok", "model_loaded": true }
```

### `GET /metadata`

Returns the real categories/ranges the model was trained on (used to build the frontend form).

```bash
curl http://localhost:8000/metadata
```
```json
{
  "categorical_features": { "location": ["thane", "new-delhi", "other", "..."], "furnishing": ["Furnished", "Semi-Furnished", "Unfurnished"], "...": "..." },
  "numeric_features": { "carpet_area_sqft": { "min": 100, "max": 9000, "median": 950 }, "...": "..." },
  "feature_order": ["carpet_area_sqft", "floor_num", "bathroom", "balcony", "location", "furnishing", "transaction", "ownership", "facing"]
}
```

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "location": "thane",
    "carpet_area_sqft": 650,
    "floor_num": 3,
    "bathroom": 2,
    "balcony": 1,
    "furnishing": "Semi-Furnished",
    "transaction": "Resale",
    "ownership": "Freehold",
    "facing": "East"
  }'
```
```json
{ "predicted_price": 5000000.0, "predicted_price_formatted": "₹50.00 Lac" }
```

A missing required field, or `"carpet_area_sqft": -50`, returns **`422 Unprocessable Entity`** with a
Pydantic validation-error body — the frontend surfaces this as an inline field error.

## Model metrics

Fill this in with the numbers your run of `notebooks/house_price_model.ipynb` §2.5 prints — they'll
vary slightly by dataset snapshot and random seed:

| Model | MAE (₹) | RMSE (₹) | R² |
|---|---|---|---|
| Linear Regression | _run the notebook_ | _run the notebook_ | _run the notebook_ |
| Gradient Boosting | _run the notebook_ | _run the notebook_ | _run the notebook_ |
| **Random Forest (chosen)** | _run the notebook_ | _run the notebook_ | _run the notebook_ |

## Screenshots

_Add screenshots of the running app here before submitting:_

- Home page with the empty form
- A filled-out form
- The result page showing a predicted price
- Swagger UI (`/docs`) showing a successful `/predict` call

## Docker (backend)

```bash
cd backend
docker build -t house-price-api .
docker run -p 8000:8000 -v $(pwd)/models:/srv/models house-price-api
```

## Notes on design decisions

- **Pipeline-based inference**: the notebook exports a single `sklearn.pipeline.Pipeline` containing
  both the `ColumnTransformer` (imputation, scaling, one-hot encoding) and the regressor, so the backend
  never re-implements preprocessing — it just calls `.predict()` on raw feature values.
- **Dynamic form metadata**: rather than hard-coding dropdown options in the frontend, `GET /metadata`
  returns the *actual* categories the `OneHotEncoder` was fit on (via `encoder.categories_`) plus
  min/max/median for every numeric feature. `locations.json` (as the assignment guide requests) is also
  exported as a static alternative.
- **Required fields + `gt=0` on area**: `PredictionRequest` fields are all required (no `Optional`), so
  a missing field or a non-positive `carpet_area_sqft` fails Pydantic validation with a `422` — matching
  the client-side validation the frontend also performs before it ever calls the API.
- **Log-transformed target**: prices are heavily right-skewed, so the model is trained on
  `log1p(price)` and predictions are inverted with `expm1()` before being returned.
