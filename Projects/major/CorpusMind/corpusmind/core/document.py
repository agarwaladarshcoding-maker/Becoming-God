"""Domain abstractions for raw documents and processed document chunks.

Design Rationale:
- Document represents an un-chunked file/resource (source of truth).
- DocumentChunk represents a semantic/structural unit optimized for vector & graph indexing.
"""

import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class Document(BaseModel):
    """Represents a raw document loaded into CorpusMind before chunking."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the document.")
    content: str = Field(..., description="Raw text or source code content.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary document metadata.")


class DocumentChunk(BaseModel):
    """Represents a discrete semantic or structural chunk of a document."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique chunk identifier.")
    document_id: str = Field(..., description="Foreign key linking back to the parent Document.")
    text: str = Field(..., description="Text payload of the chunk.")
    chunk_index: int = Field(..., description="Sequential position index within the parent document.")
    embedding: Optional[List[float]] = Field(default=None, description="Dense vector embedding representation.")
    entities: List[str] = Field(default_factory=list, description="Extracted entity keywords.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Inherited or chunk-specific metadata.")
