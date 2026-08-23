import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { predictPrice, fetchLocations } from "../api/predictionClient";
import type { PredictionRequest } from "../types/prediction";
import "./PredictionForm.css";

const NUMERIC_FIELDS = [
  "carpet_area",
  "floor",
  "bathroom",
  "balcony",
  "super_area",
  "total_floors",
  "parking_spaces",
  "is_covered",
];

function PredictionForm() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState<string[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<PredictionRequest>({
    location: "",
    carpet_area: null,
    floor: null,
    transaction: "Resale",
    furnishing: "Semi-Furnished",
    facing: null,
    overlooking: null,
    bathroom: null,
    balcony: null,
    ownership: null,
    super_area: null,
    total_floors: null,
    parking_spaces: null,
    is_covered: null,
  });

  useEffect(() => {
    fetchLocations()
      .then((data) => setLocations(data))
      .catch(() => setError("Failed to load locations"))
      .finally(() => setLocationsLoading(false));
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        value === ""
          ? null
          : NUMERIC_FIELDS.includes(name)
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await predictPrice(formData);

      navigate("/result", {
        state: {
          predicted_price: result.predicted_price,
        },
      });
    } catch {
      setError("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="prediction-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            disabled={locationsLoading}
          >
            <option value="">
              {locationsLoading ? "Loading locations..." : "Select location"}
            </option>

            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="carpet_area">Carpet Area (sqft)</label>
          <input
            id="carpet_area"
            type="number"
            name="carpet_area"
            min="0"
            value={formData.carpet_area ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="floor">Floor</label>
          <input
            id="floor"
            type="number"
            name="floor"
            value={formData.floor ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="transaction">Transaction</label>
          <select
            id="transaction"
            name="transaction"
            value={formData.transaction ?? ""}
            onChange={handleChange}
          >
            <option value="Resale">Resale</option>
            <option value="New Property">New Property</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="furnishing">Furnishing</label>
          <select
            id="furnishing"
            name="furnishing"
            value={formData.furnishing ?? ""}
            onChange={handleChange}
          >
            <option value="Semi-Furnished">Semi-Furnished</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Furnished">Furnished</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="facing">Facing</label>
          <input
            id="facing"
            type="text"
            name="facing"
            value={formData.facing ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="overlooking">Overlooking</label>
          <input
            id="overlooking"
            type="text"
            name="overlooking"
            value={formData.overlooking ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bathroom">Bathroom</label>
          <input
            id="bathroom"
            type="number"
            name="bathroom"
            min="0"
            value={formData.bathroom ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="balcony">Balcony</label>
          <input
            id="balcony"
            type="number"
            name="balcony"
            min="0"
            value={formData.balcony ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ownership">Ownership</label>
          <select
            id="ownership"
            name="ownership"
            value={formData.ownership ?? ""}
            onChange={handleChange}
          >
            <option value="">Select ownership</option>
            <option value="Freehold">Freehold</option>
            <option value="Leasehold">Leasehold</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="super_area">Super Area (sqft)</label>
          <input
            id="super_area"
            type="number"
            name="super_area"
            min="0"
            value={formData.super_area ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="total_floors">Total Floors</label>
          <input
            id="total_floors"
            type="number"
            name="total_floors"
            min="0"
            value={formData.total_floors ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="parking_spaces">Parking Spaces</label>
          <input
            id="parking_spaces"
            type="number"
            name="parking_spaces"
            min="0"
            value={formData.parking_spaces ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="is_covered">Is Covered</label>
          <select
            id="is_covered"
            name="is_covered"
            value={formData.is_covered ?? ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button className="predict-button" type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict Price"}
      </button>
    </form>
  );
}

export default PredictionForm;