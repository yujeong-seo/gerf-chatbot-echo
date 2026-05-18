FROM python:3.11-slim

WORKDIR /app

# Install system deps required by faiss-cpu and tokenizers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies as a cached layer.
# This layer is only rebuilt when requirements.txt changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model into the image so it is never
# fetched at runtime (removes the ~90 MB cold-start download).
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy application code
COPY . .

EXPOSE 8000

# Use shell form so $PORT (set by Railway) is expanded correctly.
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT}"]
