from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, description="Star rating between 1 and 5")
    comment: Optional[str] = Field(None, max_length=500, description="Optional review comment")
    rating_shop: Optional[int] = Field(None, ge=1, le=5, description="Star rating between 1 and 5")
    review_text_shop: Optional[str] = Field(None, max_length=500, description="Optional feedback notes for the canteen")
    rating_delivery: Optional[int] = Field(None, ge=1, le=5, description="Optional delivery rating")
    review_text_delivery: Optional[str] = Field(None, max_length=500, description="Optional delivery notes")

    @model_validator(mode='after')
    def normalize_fields(self):
        final_rating = self.rating_shop if self.rating_shop is not None else self.rating
        if final_rating is None:
            raise ValueError("Rating is required (between 1 and 5).")
        self.rating = final_rating
        self.rating_shop = final_rating

        final_comment = self.review_text_shop if self.review_text_shop is not None else self.comment
        self.comment = final_comment
        self.review_text_shop = final_comment
        return self

class ReviewResponse(BaseModel):
    id: str
    order_id: str
    student_id: str
    shop_id: str
    rating: int = 5
    comment: Optional[str] = None
    rating_shop: int
    rating_delivery: Optional[int] = None
    review_text_shop: Optional[str] = None
    review_text_delivery: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode='after')
    def populate_aliases(self):
        self.rating = self.rating_shop
        self.comment = self.review_text_shop
        return self

    class Config:
        from_attributes = True
