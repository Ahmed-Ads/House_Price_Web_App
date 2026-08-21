import joblib
import numpy as np

from app.core.config import settings


model = joblib.load(settings.model_path)


def predict_price(input_data):
    pred_log = model.predict(input_data)
    prediction = np.expm1(pred_log[0])

    return float(prediction)