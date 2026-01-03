from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.listing import Listing
from app.models.moderation import ModerationAction
from app.models.refresh_token import RefreshToken
import uuid

class ModerationService:
    def __init__(self, db: AsyncSession, admin_user: User):
        self.db = db
        self.admin_id = admin_user.id

    async def hide_listing(self, listing_id: uuid.UUID, reason: str = ""):
        # Update listing status
        result = await self.db.execute(select(Listing).where(Listing.id == listing_id))
        listing = result.scalars().first()
        if listing:
            listing.status = "hidden"
            self.db.add(listing)
            
            # Log action
            action = ModerationAction(
                admin_id=self.admin_id,
                action="hide_listing",
                target_type="listing",
                target_id=listing_id,
                reason=reason
            )
            self.db.add(action)
            await self.db.commit()
            return True
        return False

    async def ban_user(self, user_id: uuid.UUID, reason: str = ""):
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user:
            user.is_banned = True
            self.db.add(user)
            
            # Invalidate tokens
            # Delete refresh tokens for this user
            # Note: We rely on cascade invalidation or explicit delete
            # refresh_tokens relationship has cascade="all, delete-orphan", but unbanning might need them back?
            # Usually banning kills sessions.
            # Let's delete them.
            # Using execute delete is cleaner for bulk
            await self._delete_refresh_tokens(user_id)
            
            # Log action
            action = ModerationAction(
                admin_id=self.admin_id,
                action="ban_user",
                target_type="user",
                target_id=user_id,
                reason=reason
            )
            self.db.add(action)
            await self.db.commit()
            return True
        return False

    async def unban_user(self, user_id: uuid.UUID, reason: str = ""):
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user:
            user.is_banned = False
            self.db.add(user)
            
            action = ModerationAction(
                admin_id=self.admin_id,
                action="unban_user",
                target_type="user",
                target_id=user_id,
                reason=reason
            )
            self.db.add(action)
            await self.db.commit()
            return True
        return False
        
    async def _delete_refresh_tokens(self, user_id: uuid.UUID):
        # We can just fetch user.refresh_tokens and clear if loaded, or use delete stmt
        # Using sql delete
        from sqlalchemy import delete
        stmt = delete(RefreshToken).where(RefreshToken.user_id == user_id)
        await self.db.execute(stmt)
