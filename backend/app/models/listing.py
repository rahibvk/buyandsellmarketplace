import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, ForeignKey, func, Index, text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False, default="")
    category: Mapped[str] = mapped_column(String, nullable=False)
    brand: Mapped[str | None] = mapped_column(String, nullable=True)
    size: Mapped[str | None] = mapped_column(String, nullable=True)
    condition: Mapped[str] = mapped_column(String, nullable=False) # new, like_new, good, fair
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False, default="EUR")
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft") # draft, live, sold, hidden
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    seller = relationship("User", back_populates="listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.sort_order")
    favorites = relationship("Favorite", back_populates="listing", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_listings_status_created_at_desc", "status", text("created_at DESC")),
        Index("ix_listings_category_created_at_desc", "category", text("created_at DESC")),
        # Index("ix_listings_search_vector", func.to_tsvector("english", title + ' ' + description), postgresql_using="gin"),
        CheckConstraint("status IN ('draft', 'live', 'sold', 'hidden')", name="check_valid_status"),
        CheckConstraint("condition IN ('new', 'like_new', 'good', 'fair')", name="check_valid_condition"),
    )
