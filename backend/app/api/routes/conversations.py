from typing import Any, List
from datetime import datetime
import uuid
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import select, func, or_, and_, desc, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User as UserModel
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.listing import Listing
from app.schemas.conversation import ConversationCreate, ConversationSummary
from app.schemas.message import MessageCreate, Message as MessageSchema

router = APIRouter()

def _prepare_conversation_response(conversation: Conversation, current_user_id: uuid.UUID, last_message: Message = None, unread_count: int = 0) -> ConversationSummary:
    other_user = conversation.seller if conversation.buyer_id == current_user_id else conversation.buyer
    
    return ConversationSummary(
        id=conversation.id,
        listing_id=conversation.listing_id,
        listing_title=conversation.listing.title if conversation.listing else "Unknown Listing",
        other_user=other_user,
        last_message=last_message.body if last_message else None,
        last_message_at=conversation.last_message_at,
        unread_count=unread_count
    )

@router.post("/", response_model=ConversationSummary)
async def create_conversation(
    conversation_in: ConversationCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Create a new conversation or return existing one.
    """
    listing = await session.get(Listing, conversation_in.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    # Validation: buyer cannot be seller
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Seller cannot create a conversation with themselves")
        
    if listing.status != 'live':
        raise HTTPException(status_code=400, detail="Cannot message on a non-live listing")

    # Check if exists
    query = select(Conversation).where(
        Conversation.listing_id == conversation_in.listing_id,
        Conversation.buyer_id == current_user.id,
        Conversation.seller_id == listing.seller_id
    ).options(
        selectinload(Conversation.listing),
        selectinload(Conversation.buyer),
        selectinload(Conversation.seller)
    )
    result = await session.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        return _prepare_conversation_response(existing, current_user.id)
        
    # Create
    conversation = Conversation(
        listing_id=listing.id,
        buyer_id=current_user.id,
        seller_id=listing.seller_id
    )
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    
    # Reload with relations
    query = select(Conversation).where(Conversation.id == conversation.id).options(
        selectinload(Conversation.listing),
        selectinload(Conversation.buyer),
        selectinload(Conversation.seller)
    )
    result = await session.execute(query)
    conversation = result.scalar_one()
    
    return _prepare_conversation_response(conversation, current_user.id)

@router.get("/", response_model=List[ConversationSummary])
async def list_conversations(
    session: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    List conversations for current user.
    """
    query = select(Conversation).where(
        or_(Conversation.buyer_id == current_user.id, Conversation.seller_id == current_user.id)
    ).order_by(Conversation.last_message_at.desc()).offset(skip).limit(limit).options(
        selectinload(Conversation.listing),
        selectinload(Conversation.buyer),
        selectinload(Conversation.seller)
    )
    result = await session.execute(query)
    conversations = result.scalars().all()
    
    if not conversations:
        return []
        
    conv_ids = [c.id for c in conversations]
    
    # Fetch last messages in bulk
    if conv_ids:
        lm_query = select(Message).where(
            Message.conversation_id.in_(conv_ids)
        ).distinct(Message.conversation_id).order_by(Message.conversation_id, Message.created_at.desc())
        
        lm_result = await session.execute(lm_query)
        last_messages_map = {m.conversation_id: m for m in lm_result.scalars().all()}
        
        # Fetch unread counts in bulk
        uc_query = select(Message.conversation_id, func.count(Message.id)).where(
            Message.conversation_id.in_(conv_ids),
            Message.sender_id != current_user.id,
            Message.read_at == None
        ).group_by(Message.conversation_id)
        
        uc_result = await session.execute(uc_query)
        unread_counts_map = {row[0]: row[1] for row in uc_result.all()}
    else:
        last_messages_map = {}
        unread_counts_map = {}
    
    response = []
    for c in conversations:
        summary = _prepare_conversation_response(
            c, 
            current_user.id, 
            last_message=last_messages_map.get(c.id),
            unread_count=unread_counts_map.get(c.id, 0)
        )
        response.append(summary)
        
    return response

@router.get("/{conversation_id}/messages", response_model=List[MessageSchema])
async def get_messages(
    conversation_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
    limit: int = 50,
    after: datetime | None = None,
) -> Any:
    """
    Get messages for a conversation.
    """
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conversation.buyer_id != current_user.id and conversation.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a participant")
        
    query = select(Message).where(Message.conversation_id == conversation_id)
    if after:
        query = query.where(Message.created_at > after)
        
    query = query.order_by(Message.created_at.asc()).limit(limit)
    
    result = await session.execute(query)
    return result.scalars().all()

@router.post("/{conversation_id}/messages", response_model=MessageSchema)
async def send_message(
    conversation_id: uuid.UUID,
    message_in: MessageCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Send a message.
    """
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conversation.buyer_id != current_user.id and conversation.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a participant")
        
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        body=message_in.body
    )
    session.add(message)
    
    # Update conversation timestamp
    conversation.last_message_at = func.now()
    session.add(conversation)
    
    await session.commit()
    await session.refresh(message)
    return message

@router.post("/{conversation_id}/read")
async def mark_read(
    conversation_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Mark all messages in conversation as read.
    """
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conversation.buyer_id != current_user.id and conversation.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a participant")
        
    stmt = update(Message).where(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.read_at == None
    ).values(read_at=func.now())
    
    await session.execute(stmt)
    await session.commit()
    return {"status": "success"}
