import chromadb
from sentence_transformers import SentenceTransformer
import fitz  # pymupdf
import os
from app.core.config import settings

client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
collection = client.get_or_create_collection(name="ml_knowledge")
embedder = SentenceTransformer(settings.EMBEDDING_MODEL)

def load_books_into_db():
    books_path = "./data/books"
    if not os.path.exists(books_path):
        print("No books folder found")
        return

    existing = collection.count()
    if existing > 0:
        print(f"Knowledge base already has {existing} chunks, skipping.")
        return

    print("Loading books into vector database...")
    for filename in os.listdir(books_path):
        if filename.endswith(".pdf"):
            filepath = os.path.join(books_path, filename)
            print(f"Processing: {filename}")
            doc = fitz.open(filepath)
            full_text = ""
            for page in doc:
                full_text += page.get_text()

            # Chunk the text
            chunk_size = 500
            overlap = 50
            words = full_text.split()
            chunks = []
            for i in range(0, len(words), chunk_size - overlap):
                chunk = " ".join(words[i:i + chunk_size])
                if chunk.strip():
                    chunks.append(chunk)

            # Store in ChromaDB
            embeddings = embedder.encode(chunks).tolist()
            ids = [f"{filename}_{i}" for i in range(len(chunks))]
            collection.add(embeddings=embeddings, documents=chunks, ids=ids)
            print(f"Added {len(chunks)} chunks from {filename}")

    print("Knowledge base ready!")

def retrieve_context(query: str, n_results: int = 3) -> str:
    if collection.count() == 0:
        return "No knowledge base available."
    query_embedding = embedder.encode([query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=n_results)
    chunks = results["documents"][0]
    return "\n\n".join(chunks)