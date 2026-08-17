from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    db_user: str
    db_password: str
    db_host: str
    db_port: int
    db_name: str
    clinicaltrials_base_url: str = "https://clinicaltrials.gov/api/v2"


settings = Settings()
