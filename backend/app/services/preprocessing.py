import pandas as pd


# Maps the snake_case field names used by PredictionRequest to the exact
# column names the training pipeline's ColumnTransformer was fit on
# (see Notebooks/House_Price_Prediction.ipynb, sections 5-7). These must
# match exactly, or the model silently receives NaN/None for that column.
FIELD_TO_MODEL_COLUMN = {
    "location": "location",
    "carpet_area": "Carpet Area",
    "floor": "Floor",
    "transaction": "Transaction",
    "furnishing": "Furnishing",
    "facing": "facing",
    "overlooking": "overlooking",
    "bathroom": "Bathroom",
    "balcony": "Balcony",
    "ownership": "Ownership",
    "super_area": "Super Area",
    "total_floors": "Total Floors",
    "parking_spaces": "Parking Spaces",
    "is_covered": "Is Covered",
}


def prepare_input(data: dict) -> pd.DataFrame:
    """Convert a PredictionRequest.model_dump() dict into the single-row
    DataFrame the trained pipeline expects, with the model's own column
    names/order."""
    input_data = {
        model_column: data.get(field)
        for field, model_column in FIELD_TO_MODEL_COLUMN.items()
    }

    return pd.DataFrame([input_data])