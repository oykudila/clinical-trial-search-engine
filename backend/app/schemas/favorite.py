from pydantic import Field

from app.schemas.base import ApiBaseModel


class FavoriteCreate(ApiBaseModel):
    nct_id: str = Field(min_length=11, max_length=11)
