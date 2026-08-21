import type {
  PredictionRequest,
  PredictionResponse,
} from "../types/prediction";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function predictPrice(
  data: PredictionRequest
): Promise<PredictionResponse> {

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Prediction request failed");
  }

  return response.json();
}