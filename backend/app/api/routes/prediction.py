from fastapi import APIRouter
import json
from pathlib import Path

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.preprocessing import prepare_input
from app.services.inference import predict_price

LOCATIONS_PATH = Path(__file__).resolve().parents[3] / "models" / "locations.json"

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "healthy"}

@router.get("/locations")
def get_locations():
    with open(LOCATIONS_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):

    data = request.model_dump()

    input_df = prepare_input(data)

    prediction = predict_price(input_df)

    return PredictionResponse(
        predicted_price=prediction
    )