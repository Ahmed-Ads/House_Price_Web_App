from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "model_loaded" in body    
    
def test_prediction():
    payload = {
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
        "super_area": None,
        "total_floors": 6,
        "parking_spaces": 1,
        "is_covered": 1
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert "predicted_price" in data
    assert isinstance(data["predicted_price"], float)
    assert data["predicted_price"] > 0