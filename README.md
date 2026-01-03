# BuyAndSell Marketplace MVP Backend

Backend for a Vinted-like marketplace MVP.

## Tech Stack
- FastAPI
- PostgreSQL
- SQLAlchemy (Async)
- Alembic
- Docker & Docker Compose

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Running Locally

1. Start the services:
   ```bash
   docker-compose up --build
   ```
2. The API will be available at `http://localhost:8000`.
3. OpenAPI documentation at `http://localhost:8000/docs`.

### Running Migrations

```bash
docker-compose exec api alembic upgrade head
```

### Running Tests

```bash
docker-compose run --rm api pytest
```

## Messaging Feature Manual Testing

1. **Setup**: Correctly start the stack (`docker-compose up --build`).
2. **Create Users**:
   - Register User A (Seller) (`POST /auth/signup`).
   - Register User B (Buyer) (`POST /auth/signup`).
3. **Create Listing**:
   - Log in as User A.
   - Create a listing (`POST /listings`).
   - **Publish** the listing (`POST /listings/{id}/publish`). *Required for messaging.*
4. **Start Conversation**:
   - Log in as User B (Frontend `http://localhost:3000`).
   - Navigate to the listing page.
   - Click **"Message"** button.
   - Verify redirection to `/inbox?conversation_id=...` and conversation is created.
5. **Messaging Flow**:
   - User B: Type and send a message. Verify it appears in the thread.
   - User A: Go to `/inbox`. Verify the conversation appears with **unread count badge**.
   - User A: Click conversation. Verify message content.
   - User A: Reply.
   - User B: Verify reply appears automatically (polling every 3-5 seconds).

