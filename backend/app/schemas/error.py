from app.schemas.base import ApiBaseModel


class ApiError(ApiBaseModel):
    code: str
    message: str
