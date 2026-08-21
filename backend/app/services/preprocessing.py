import pandas as pd


FEATURES = [
    "location",
    "Carpet Area",
    "Floor",
    "Transaction",
    "Furnishing",
    "facing",
    "overlooking",
    "Bathroom",
    "Balcony",
    "Ownership",
    "Super Area",
    "Total Floors",
    "Parking Spaces",
    "Is Covered",
]


def prepare_input(data: dict) -> pd.DataFrame:
    input_data = {
        feature: data.get(feature)
        for feature in FEATURES
    }

    return pd.DataFrame([input_data])