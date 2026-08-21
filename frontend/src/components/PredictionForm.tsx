import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { predictPrice } from "../api/predictionClient";
import type { PredictionRequest } from "../types/prediction";


function PredictionForm() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState<string[]>([]);
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
    fetch("http://127.0.0.1:8000/locations")
      .then((response) => response.json())
      .then((data) => setLocations(data))
      .catch(() => setError("Failed to load locations"));
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
          : [
                "carpet_area",
                "floor",
                "bathroom",
                "balcony",
                "super_area",
                "total_floors",
                "parking_spaces",
                "is_covered",
              ].includes(name)
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
    <form onSubmit={handleSubmit}>

      <label>Location</label>
      <select
        name="location"
        value={formData.location}
        onChange={handleChange}
        required
      >
        <option value="">Select location</option>

        {locations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>


      <label>Carpet Area</label>
      <input
        type="number"
        name="carpet_area"
        value={formData.carpet_area ?? ""}
        onChange={handleChange}
      />


      <label>Floor</label>
      <input
        type="number"
        name="floor"
        value={formData.floor ?? ""}
        onChange={handleChange}
      />


      <label>Transaction</label>
      <select
        name="transaction"
        value={formData.transaction ?? ""}
        onChange={handleChange}
      >
        <option value="Resale">Resale</option>
        <option value="New Property">New Property</option>
      </select>


      <label>Furnishing</label>
      <select
        name="furnishing"
        value={formData.furnishing ?? ""}
        onChange={handleChange}
      >
        <option value="Semi-Furnished">Semi-Furnished</option>
        <option value="Unfurnished">Unfurnished</option>
        <option value="Furnished">Furnished</option>
      </select>


      <label>Facing</label>
      <input
        type="text"
        name="facing"
        value={formData.facing ?? ""}
        onChange={handleChange}
      />


      <label>Overlooking</label>
      <input
        type="text"
        name="overlooking"
        value={formData.overlooking ?? ""}
        onChange={handleChange}
      />


      <label>Bathroom</label>
      <input
        type="number"
        name="bathroom"
        value={formData.bathroom ?? ""}
        onChange={handleChange}
      />


      <label>Balcony</label>
      <input
        type="number"
        name="balcony"
        value={formData.balcony ?? ""}
        onChange={handleChange}
      />


      <label>Ownership</label>
      <select
        name="ownership"
        value={formData.ownership ?? ""}
        onChange={handleChange}
      >
        <option value="">Select ownership</option>
        <option value="Freehold">Freehold</option>
        <option value="Leasehold">Leasehold</option>
      </select>


      <label>Super Area</label>
      <input
        type="number"
        name="super_area"
        value={formData.super_area ?? ""}
        onChange={handleChange}
      />


      <label>Total Floors</label>
      <input
        type="number"
        name="total_floors"
        value={formData.total_floors ?? ""}
        onChange={handleChange}
      />


      <label>Parking Spaces</label>
      <input
        type="number"
        name="parking_spaces"
        value={formData.parking_spaces ?? ""}
        onChange={handleChange}
      />


      <label>Is Covered</label>
      <select
        name="is_covered"
        value={formData.is_covered ?? ""}
        onChange={handleChange}
      >
        <option value="">Select</option>
        <option value="1">Yes</option>
        <option value="0">No</option>
      </select>


      {error && <p>{error}</p>}


      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict Price"}
      </button>

    </form>
  );
}

export default PredictionForm;