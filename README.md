# Autofill Backend

A Node.js backend service for handling image uploads and client data with Supabase integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your `.env` file with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_BUCKET_NAME=your_bucket_name_here
SUPABASE_TABLE_NAME=your_table_name_here
```

## API Endpoints

### GET /
Health check endpoint that returns "Hello World!"

### POST /upload
Upload an image and store client data.

**Request Body:**
```json
{
  "clientName": "John Doe",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Image uploaded and data inserted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clientName": "John Doe",
    "date": "2024-01-01T00:00:00.000Z",
    "imageUrl": "550e8400-e29b-41d4-a716-446655440000.png"
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Missing required fields: clientName and image are required"
}
```

## Database Schema

The service expects a table with the following structure:
- `id` (UUID) - Primary key, generated automatically
- `client_name` (TEXT) - Name of the client
- `date` (TIMESTAMP) - Date of upload
- Additional Supabase fields can be added as needed

## Storage

Images are stored in a Supabase storage bucket with the filename format: `{uuid}.{extension}`

## Running the Server

```bash
node index.js
```

The server will start on port 3000.
