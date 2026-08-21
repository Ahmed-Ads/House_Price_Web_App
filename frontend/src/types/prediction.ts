export interface PredictionRequest {
  location: string;
  carpet_area?: number | null;
  floor?: number | null;
  transaction?: string | null;
  furnishing?: string | null;
  facing?: string | null;
  overlooking?: string | null;
  bathroom?: number | null;
  balcony?: number | null;
  ownership?: string | null;
  super_area?: number | null;
  total_floors?: number | null;
  parking_spaces?: number | null;
  is_covered?: number | null;
}

export interface PredictionResponse {
  predicted_price: number;
}