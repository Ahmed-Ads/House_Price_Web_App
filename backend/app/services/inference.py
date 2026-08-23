import logging

import joblib
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    model = joblib.load(settings.model_path)
except Exception as error:
    model = None
    logger.error(
        "Failed to load model at '%s': %s. Run the notebook and copy the "
        "resulting house_price.pkl into backend/models/ before predicting.",
        settings.model_path,
        error,
    )


def is_model_loaded() -> bool:
    return model is not None


def predict_price(input_data):
    if model is None:
        raise RuntimeError(
            f"Model is not loaded (expected file at '{settings.model_path}')."
        )

    pred_log = model.predict(input_data)
    prediction = np.expm1(pred_log[0])

    return float(prediction)