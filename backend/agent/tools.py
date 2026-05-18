"""Custom LangChain tools for the GERF agent."""
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools.retriever import create_retriever_tool
from langchain_text_splitters import RecursiveCharacterTextSplitter

_RAG_DIR = Path(__file__).parent.parent.parent / "rag"
_FAQ_PDF = _RAG_DIR / "gerf_2026_faq.pdf"
_FAISS_DIR = _RAG_DIR / "faq_index"


def build_faq_tool():
    """Return a LangChain retriever tool backed by the GERF FAQ PDF.

    Builds a FAISS index from the PDF on first call and persists it to
    rag/faq_index/ so subsequent starts skip the embedding step.
    """
    embeddings = OpenAIEmbeddings()

    if _FAISS_DIR.exists():
        vectorstore = FAISS.load_local(
            str(_FAISS_DIR), embeddings, allow_dangerous_deserialization=True
        )
    else:
        loader = PyPDFLoader(str(_FAQ_PDF))
        pages = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        docs = splitter.split_documents(pages)
        vectorstore = FAISS.from_documents(docs, embeddings)
        vectorstore.save_local(str(_FAISS_DIR))

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    return create_retriever_tool(
        retriever,
        name="gerf_faq",
        description=(
            "Use for general festival questions: getting there, parking, food and drink, "
            "accessibility policies, what to bring, opening times, lost property, "
            "or anything not about a specific event in the programme. "
            "Do NOT use for event time / zone / age / registration queries."
        ),
    )
