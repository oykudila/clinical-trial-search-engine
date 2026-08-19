import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.database import Base
from app.models import Favorite


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_duplicate_favorites_integrity_error(db_session):
    db_session.add(Favorite(nct_id="NCT12345678"))
    db_session.commit()

    db_session.add(Favorite(nct_id="NCT12345678"))
    with pytest.raises(IntegrityError):
        db_session.commit()
