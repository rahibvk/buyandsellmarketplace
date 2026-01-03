from fastapi import APIRouter
from app.api.routes import auth, users, listings, media, feed, search, favorites, events, conversations, admin

api_router = APIRouter()

# Placeholder imports, files will be created next.
# Once created, we will uncomment these includes.
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(feed.router, prefix="/feed", tags=["feed"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
