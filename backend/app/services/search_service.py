from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, text, or_
from sqlalchemy.orm import selectinload
from app.models.listing import Listing
from app.models.listing_image import ListingImage

async def get_feed(db: AsyncSession, category: str | None = None, page: int = 1, page_size: int = 20):
    # Base query
    query = select(Listing).where(Listing.status == "live")
    if category:
        query = query.where(Listing.category == category)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Pagination
    query = query.order_by(desc(Listing.created_at), Listing.id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.options(selectinload(Listing.images), selectinload(Listing.seller))
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    import math
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": page_size,
        "pages": math.ceil(total / page_size) if page_size > 0 else 0
    }

async def search_listings(
    db: AsyncSession, 
    q: str | None = None, 
    category: str | None = None, 
    min_price: float | None = None, 
    max_price: float | None = None,
    brand: str | None = None,
    condition: str | None = None,
    page: int = 1, 
    page_size: int = 20
):
    query = select(Listing).where(Listing.status == "live")
    
    if q:
        # Simple FTS using plainto_tsquery or websearch_to_tsquery
        # In SQLAlchemy 2.0 with PostgreSQL dialect we can use match or tsvector ops
        # We defined index: Index("ix_listings_search_vector", func.to_tsvector("english", title + ' ' + description), postgresql_using="gin")
        # To use it, we match against to_tsvector logic
        
        # Method 1: Using @@ operator with text()
        # query = query.where(text("to_tsvector('english', title || ' ' || description) @@ websearch_to_tsquery('english', :q)")).params(q=q)
        
        # Method 2: func usage
        # This is cleaner but requires ensuring the index matches exactly the expression.
        # The index is on (title + ' ' + desc).
        
        search_vector = func.to_tsvector('english', Listing.title + ' ' + Listing.description)
        search_query = func.websearch_to_tsquery('english', q)
        query = query.where(search_vector.op('@@')(search_query))
        
    if category:
        query = query.where(Listing.category == category)
    if min_price is not None:
        query = query.where(Listing.price >= min_price)
    if max_price is not None:
        query = query.where(Listing.price <= max_price)
    if brand:
        query = query.where(Listing.brand == brand)
    if condition:
        query = query.where(Listing.condition == condition)
        
    
    # Clone query for counting before applying sort/limit
    count_query_stmt = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query_stmt) or 0

    query = query.order_by(desc(Listing.created_at), Listing.id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.options(selectinload(Listing.images), selectinload(Listing.seller))
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    import math
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": page_size,
        "pages": math.ceil(total / page_size) if page_size > 0 else 0
    }
