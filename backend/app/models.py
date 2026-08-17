from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True)
    nct_id = Column(String(11), unique=True, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
