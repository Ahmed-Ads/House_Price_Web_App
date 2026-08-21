import joblib
import json
import numpy as np
import pandas as pd

from flask import Flask, request, jsonify


app = Flask(__name__)


# =========================
# Load Model
# =========================

model = joblib.load("House_price.pkl")

# =========================
# Load Locations
# =========================

with open("locations.json", "r") as f:
    locations = json.load(f)


# =========================
# Home
# =========================

@app.route("/")
def home():
    return "House Price Prediction API is running!"


# =========================
# Locations
# =========================

@app.route("/locations", methods=["GET"])
def get_locations():
    return jsonify(locations)


# =========================
# Prediction
# =========================

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    features = [
        'location',
        'Carpet Area',
        'Floor',
        'Transaction',
        'Furnishing',
        'facing',
        'overlooking',
        'Bathroom',
        'Balcony',
        'Ownership',
        'Super Area',
        'Total Floors',
        'Parking Spaces',
        'Is Covered'
    ]

    input_data = {}

    for feature in features:
        input_data[feature] = data.get(feature)

    input_df = pd.DataFrame([input_data])

    # Model predicts log(price)
    pred_log = model.predict(input_df)

    # Convert back to original price
    prediction = np.expm1(pred_log[0])

    return jsonify({
        "predicted_price": float(prediction)
    })


print("APP FILE STARTED")

if __name__ == "__main__":
    print("STARTING FLASK...")
    app.run(debug=True)