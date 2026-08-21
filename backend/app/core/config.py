from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_path: str = "models/house_price.pkl"
    locations_path: str = "models/locations.json"
    api_title: str = "House Price Prediction API"
    api_version: str = "1.0.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()