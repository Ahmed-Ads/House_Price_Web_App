from typing import Optional
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    location: str
    carpet_area: Optional[float] = None
    floor: Optional[float] = None
    transaction: Optional[str] = None
    furnishing: Optional[str] = None
    facing: Optional[str] = None
    overlooking: Optional[str] = None
    bathroom: Optional[float] = None
    balcony: Optional[float] = None
    ownership: Optional[str] = None
    super_area: Optional[float] = None
    total_floors: Optional[float] = None
    parking_spaces: Optional[float] = None
    is_covered: Optional[float] = None


class PredictionResponse(BaseModel):
    predicted_price: float