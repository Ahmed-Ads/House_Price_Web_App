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
│   │   │   ├── preprocessing.py       # request dict -> one-row DataFrame (model column names)
│   │   │   └── inference.py           # loads the pickled pipeline, runs predict()
│   │   └── utils/logging_config.py    # basic logging setup, wired into main.py
│   ├── app_old.py                # legacy Flask prototype, kept for reference — not used by the app
│   ├── models/
│   │   ├── house_price.pkl       # trained pipeline — NOT committed, see "Get a trained model" below
│   │   └── locations.json        # list of locations the model was trained on
│   ├── tests/test_prediction.py  # 2 tests: /health, happy-path /predict
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
└── frontend/
    └── src/
        ├── api/predictionClient.ts   # predictPrice() and fetchLocations(), both use VITE_API_BASE_URL
        ├── components/PredictionForm.tsx
        ├── pages/{HomePage,ResultPage,NotFoundPage}.tsx
        ├── types/prediction.ts       # TS types mirroring the backend schema
        └── App.tsx                  # routes: / , /result , * (404)
```

`backend/models/house_price.pkl` is `.gitignore`d — you generate it yourself by running the
notebook (see below) and dropping it in that folder.

## Get the dataset

The dataset is already included as a zip — no Kaggle download needed:

```bash
cd Data
unzip House_price_data.zip
```

This extracts `house_prices.csv` (~106 MB).

## 1. Get a trained model

### Option A — download the pre-trained model (recommended, fast)

A ready-to-use model is attached to the
[`v1.0-model` release](https://github.com/Ahmed-Ads/House_Price_Web_App/releases/tag/v1.0-model).
Download `House_price.pkl` from there, rename it to lowercase, and place it at:

```bash
backend/models/house_price.pkl
```

Or via the command line:

```bash
curl -L -o backend/models/house_price.pkl https://github.com/Ahmed-Ads/House_Price_Web_App/releases/download/v1.0-model/House_price.pkl
```

The filename must be exactly `house_price.pkl` (all lowercase) to match `MODEL_PATH` in
`backend/.env.example` — this matters even if you're on Windows, since the app may later be
deployed on a case-sensitive filesystem (Linux/macOS/most Docker images).

This model was trained with `scikit-learn==1.6.1`, which `backend/requirements.txt` pins for
exactly this reason — see the note below.

### Option B — train it yourself from the notebook

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

**Important — matching scikit-learn version:** the model was trained with `scikit-learn==1.6.1`.
Loading a pickle saved by one scikit-learn version with a different (especially newer) version can
fail outright (an internal class the pickle refers to may no longer exist). `backend/requirements.txt`
pins `scikit-learn==1.6.1` for exactly this reason — don't remove that pin unless you retrain and
re-export the model with the newer version too.

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

If `house_price.pkl` isn't in `backend/models/` yet (or fails to load), the server still starts —
`/health` will report `"model_loaded": false` and `/predict` will return a `503` with a clear
message instead of crashing, until you drop the model file in.

### Backend environment variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `MODEL_PATH` | `models/house_price.pkl` | Path the pipeline is loaded from |
| `LOCATIONS_PATH` | `models/locations.json` | Path `GET /locations` reads from |
| `API_TITLE` | `House Price Prediction API` | FastAPI app title (shown in `/docs`) |
| `API_VERSION` | `1.0.0` | FastAPI app version |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of origins allowed to call the API |

All five are actually read by the app via `app/core/config.py`'s `Settings` object.

### Windows notes

- If `npm`/PowerShell scripts are blocked with a `running scripts is disabled` error, either run
  `npm install` from Command Prompt instead of PowerShell, or (as admin) run
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
- `python -m venv venv` picks up whatever `python` resolves to on your `PATH`. If you have multiple
  Python installs (Anaconda, MSYS2, the Microsoft Store version, etc.), you may get a Unix-style
  venv (a `bin/` folder instead of `Scripts/`) or a Python version too new for some pinned
  dependencies to have prebuilt wheels for. Use `py -0` to list installed versions and
  `py -3.12 -m venv venv` (or another specific version) to force a known-good one.
- In VS Code, set the Python interpreter explicitly (`Ctrl+Shift+P` → `Python: Select Interpreter`)
  to the one inside `backend/venv`, or import errors like `Import "fastapi" could not be resolved`
  will show even though the packages are installed.

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env    # Windows: copy .env.example .env
npm run dev      # http://127.0.0.1:5173
npm run build    # production build, output in dist/
```

`frontend/.env.example` contains:

```
VITE_API_BASE_URL=http://localhost:8000
```

Both `predictPrice()` and `fetchLocations()` in `predictionClient.ts` read this variable, so
pointing the frontend at a different backend only requires editing `.env` — no code changes.

## API reference

### `GET /health`

```bash
curl http://localhost:8000/health
```
```json
{ "status": "healthy", "model_loaded": true }
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

The response is just the raw predicted number in rupees. The frontend (`ResultPage.tsx`) formats
it for display (see below) — the API itself does no formatting.

## Docker (backend)

```bash
cd backend
docker build -t house-price-api .
docker run -p 8000:8000 -v $(pwd)/models:/srv/models house-price-api
```

## Notes on design decisions

- **Pipeline-based inference**: the notebook exports a single `sklearn.pipeline.Pipeline`
  containing both the `ColumnTransformer` (imputation, scaling, one-hot encoding) and the
  regressor, so the backend never re-implements preprocessing — it just calls `.predict()` on a
  one-row DataFrame.
- **Field name mapping**: `PredictionRequest` uses snake_case field names (`carpet_area`, `total_floors`,
  etc.) for a clean API, but the trained pipeline expects the exact column names/casing from the
  training data (`"Carpet Area"`, `"Total Floors"`, etc.). `preprocessing.py`'s `FIELD_TO_MODEL_COLUMN`
  dict bridges the two explicitly — this mapping has to stay in sync with the notebook's `num_cols`
  / `cat_cols` if the notebook is ever changed.
- **Log-transformed target**: prices are heavily right-skewed, so the model is trained on
  `log1p(price)` and predictions are inverted with `expm1()` before being returned.
- **Dynamic locations list**: rather than hard-coding the dropdown options in the frontend,
  `locations.json` is exported directly from the training data's unique `location` values and
  served via `GET /locations`.
- **Defensive model loading**: `inference.py` catches any failure while loading the pickle (missing
  file, version mismatch, corruption) rather than letting it crash the whole app at startup. Check
  `/health`'s `model_loaded` field or the server logs if predictions return a `503`.
- **Manual number formatting on the frontend**: `ResultPage.tsx` formats the predicted price (Indian
  digit grouping, e.g. `₹3,17,01,408`) and its approximate USD equivalent by hand instead of using
  `toLocaleString()`. The browser's locale-based formatting can pick up the OS's regional number
  settings (some Windows regional formats use `.` instead of `,` as the group separator), which
  produced incorrect-looking output like `50.23.21.256` in testing. The manual formatters guarantee
  a comma separator regardless of the user's system settings. The USD figure uses a fixed
  approximate exchange rate (`USD_PER_INR` in `ResultPage.tsx`) rather than a live rate, since there's
  no backend endpoint for currency conversion — it's labeled "approx." in the UI and should be
  updated occasionally if kept long-term.
