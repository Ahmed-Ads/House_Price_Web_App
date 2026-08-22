# House Price Prediction — End-to-End ML Web App

Predicts the price of a residential property in India from its listing details
(location, carpet area, floor, furnishing, etc.), using a Random Forest model
trained on ~187k real Kaggle listings, served through a FastAPI backend and a
React + TypeScript frontend.

## Overview

|              |                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **Dataset**  | [House Price by Juhi Bhojani](https://www.kaggle.com/datasets/juhibhojani/house-price) (Kaggle, 187,531 rows, 21 columns) — shipped in this repo as `Data/House_price_data.zip` |
| **Model**    | Random Forest Regressor, tuned with `RandomizedSearchCV` (chosen over Linear Regression / Gradient Boosting — see the notebook §8) |
| **Backend**  | FastAPI, serving the model behind `/predict`, with `/locations` and `/health` as supporting endpoints |
| **Frontend** | React 19 + TypeScript (Vite), a form → result page flow |

## Project structure

```
House_Price_Web_App/
├── Data/
│   └── House_price_data.zip     # zipped house_prices.csv (~106 MB unzipped)
├── Notebooks/
│   └── House_Price_Prediction.ipynb   # cleaning → EDA → training → evaluation → export
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, includes the prediction router
│   │   ├── api/routes/prediction.py   # GET /health, GET /locations, POST /predict
│   │   ├── core/config.py             # pydantic-settings config (reads .env)
│   │   ├── schemas/prediction.py      # PredictionRequest / PredictionResponse
│   │   ├── services/
│   │   │   ├── preprocessing.py       # request dict -> one-row DataFrame
│   │   │   └── inference.py           # loads the pickled pipeline, runs predict()
│   │   └── utils/logging_config.py    # basic logging setup (not yet wired into main.py)
│   ├── app_old.py                # legacy Flask prototype, kept for reference — not used by the app
│   ├── models/
│   │   └── locations.json        # list of locations the model was trained on
│   ├── tests/test_prediction.py  # 2 tests: /health, happy-path /predict
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
└── frontend/
    └── src/
        ├── api/predictionClient.ts   # POSTs to `${VITE_API_BASE_URL}/predict`
        ├── components/PredictionForm.tsx
        ├── pages/{HomePage,ResultPage,NotFoundPage}.tsx
        ├── types/prediction.ts       # TS types mirroring the backend schema
        └── App.tsx                  # routes: / , /result , * (404)
```

Note: `backend/models/house_price.pkl` is **not** committed (it's `.gitignore`d — see "Get a
trained model" below). You have to generate it yourself by running the notebook.

## Get the dataset

The dataset is already included as a zip — no Kaggle download needed:

```bash
cd Data
unzip House_price_data.zip
```

This extracts `house_prices.csv` (~106 MB).

## 1. Get a trained model

The notebook (`Notebooks/House_Price_Prediction.ipynb`) was originally run on Kaggle and reads
the CSV from a Kaggle-specific path:

```python
df = pd.read_csv('/kaggle/input/datasets/juhibhojani/house-price/house_prices.csv')
```

To run it locally, change that line to point at the CSV you unzipped above, e.g.
`pd.read_csv('../Data/house_prices.csv')`.

```bash
cd Notebooks
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install jupyter pandas numpy scikit-learn matplotlib seaborn joblib
jupyter notebook House_Price_Prediction.ipynb
```

Run all cells top to bottom. The last cells save `House_price.pkl` and `locations.json` into the
notebook's working directory. Copy the model into the backend (the app expects
`backend/models/house_price.pkl`, lowercase):

```bash
cp House_price.pkl ../backend/models/house_price.pkl
```

`locations.json` is already committed in `backend/models/`, so you don't need to re-copy it unless
you want to regenerate it from a newer training run.

### Model performance (from the notebook's own run)

| Model | MAE (₹) | RMSE (₹) | R² |
|---|---|---|---|
| Linear Regression | 4,066,831 | 23,024,670 | -2.97 |
| Gradient Boosting | 2,149,678 | 4,631,656 | 0.84 |
| **Random Forest (chosen)** | **830,281** | **3,455,255** | **0.91** |

The target (`Amount`) is log-transformed (`log1p`) before training; predictions are inverted with
`expm1()` before being returned, both in the notebook and in `inference.py`.

## 2. Run the backend

```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload --port 8000
pytest   # 2 tests: /health, happy-path /predict
```

Open `http://127.0.0.1:8000/docs` for interactive Swagger UI.

### Backend environment variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `MODEL_PATH` | `models/house_price.pkl` | Path the pipeline is loaded from at import time — this is the one that actually matters |
| `LOCATIONS_PATH` | `models/locations.json` | Declared in settings, but `GET /locations` currently resolves its own path independently rather than reading this value |
| `API_TITLE` | `House Price Prediction API` | Declared in settings, but `main.py` currently hardcodes the FastAPI title instead of reading it |
| `API_VERSION` | `1.0.0` | Same as above — declared but not currently read by `main.py` |

CORS is currently hardcoded in `main.py` to allow `http://localhost:5173` (there's no `CORS_ORIGINS`
env var).

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # production build, output in dist/
```

There's no `frontend/.env.example` in the repo. `predictionClient.ts` reads
`import.meta.env.VITE_API_BASE_URL` for the `/predict` call, so create `frontend/.env` yourself with:

```
VITE_API_BASE_URL=http://localhost:8000
```

Note that `PredictionForm.tsx` currently fetches `/locations` from a hardcoded
`http://127.0.0.1:8000/locations` rather than using `VITE_API_BASE_URL`, so it won't follow a
different `VITE_API_BASE_URL` value.

## API reference

### `GET /health`

```bash
curl http://localhost:8000/health
```
```json
{ "status": "healthy" }
```

### `GET /locations`

Returns the list of location values the model was trained on (used to populate the location
dropdown in the form).

```bash
curl http://localhost:8000/locations
```
```json
["Other", "agra", "ahmedabad", "aurangabad", "..."]
```

### `POST /predict`

`location` is the only required field; everything else is optional.

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "location": "kolkata",
    "carpet_area": 600,
    "floor": 3,
    "transaction": "Resale",
    "furnishing": "Semi-Furnished",
    "facing": "West",
    "overlooking": "Garden/Park",
    "bathroom": 2,
    "balcony": 1,
    "ownership": "Freehold",
    "super_area": null,
    "total_floors": 6,
    "parking_spaces": 1,
    "is_covered": 1
  }'
```
```json
{ "predicted_price": 5123456.0 }
```

There's no `predicted_price_formatted` field — the response is just the raw number, and the
frontend (`ResultPage.tsx`) formats it into `₹` on the client side.

## Docker (backend)

```bash
cd backend
docker build -t house-price-api .
docker run -p 8000:8000 -v $(pwd)/models:/srv/models house-price-api
```

## Known issues / things to check before relying on this

- **`preprocessing.py`'s feature names don't match the request schema.** `FEATURES` in
  `preprocessing.py` uses names like `"Carpet Area"`, `"Floor"`, `"Bathroom"`, `"Super Area"`, etc.,
  but `PredictionRequest` (and the frontend) use `carpet_area`, `floor`, `bathroom`, `super_area`,
  etc. Since `prepare_input()` does `data.get(feature)` against those mismatched keys, most fields
  silently resolve to `None` before reaching the model — only `location`, `facing`, and
  `overlooking` currently pass through correctly, regardless of what the user enters for area,
  floor, bathrooms, etc.
- **`GET /health` doesn't check the model.** It always returns `{"status": "healthy"}`; if the
  model file is missing, the app fails at import time (`inference.py` loads it at module load),
  not at request time.
- **`app_old.py`** is a legacy Flask version of the API kept in the repo for reference — it isn't
  used by the current FastAPI app and doesn't need to be run.

## Notes on design decisions

- **Pipeline-based inference**: the notebook exports a single `sklearn.pipeline.Pipeline`
  containing both the `ColumnTransformer` (imputation, scaling, one-hot encoding) and the
  regressor, so the backend never re-implements preprocessing — it just calls `.predict()` on a
  one-row DataFrame.
- **Log-transformed target**: prices are heavily right-skewed, so the model is trained on
  `log1p(price)` and predictions are inverted with `expm1()` before being returned.
- **Dynamic locations list**: rather than hard-coding the dropdown options in the frontend,
  `locations.json` is exported directly from the training data's unique `location` values and
  served via `GET /locations`.
