from sqlalchemy import Column, Integer, Float, String, Text
from .database import Base

class DesignHistory(Base):
    __tablename__ = "design_history"
    id = Column(Integer, primary_key=True, index=True)
    brightness = Column(Float)
    complexity = Column(Float)
    saliency = Column(Float)
    symmetry = Column(Float)
    space = Column(Float)
    colors = Column(String) # 리스트를 문자열로 저장
    description = Column(Text)