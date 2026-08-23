import json

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.inference import is_model_loaded, predict_price
from app.services.preprocessing import prepare_input

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "healthy", "model_loaded": is_model_loaded()}


@router.get("/locations")
def get_locations():
    with open(settings.locations_path, "r", encoding="utf-8") as file:
        return json.load(file)


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    data = request.model_dump()
    input_df = prepare_input(data)

    try:
        prediction = predict_price(input_df)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))

    return PredictionResponse(predicted_price=prediction)