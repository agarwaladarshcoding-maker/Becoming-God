"""Chunking strategies for document evaluation and bake-off comparisons.

This module provides fixed-size character chunking and recursive hierarchical chunking
implementations adhering to CorpusMind's modular architecture rules.

Design Rationale:
- Fixed-size chunking provides deterministic length bounds but can split mid-sentence or mid-word.
- Recursive hierarchical chunking respects structural semantics (paragraphs, sentences) first,
  falling back to character splitting only when necessary.
"""

from typing import List, Optional
from corpusmind.core.document import DocumentChunk


def fixed_chunks(
    text: str,
    doc_id: str = "doc_eval",
    size: int = 800,
    overlap: int = 100,
    metadata: Optional[dict] = None
) -> List[DocumentChunk]:
    """Splits input text into fixed-character size chunks with a specified overlap.

    Args:
        text: Raw document text content.
        doc_id: Parent document identifier for tracking provenance.
        size: Maximum character count per chunk.
        overlap: Character overlap count between consecutive chunks.
        metadata: Optional metadata dictionary to attach to generated chunks.

    Returns:
        List of DocumentChunk instances.
    """
    if not text or size <= 0:
        return []

    metadata = metadata or {}
    chunks: List[DocumentChunk] = []
    step = max(1, size - overlap)
    text_length = len(text)
    chunk_index = 0

    start = 0
    while start < text_length:
        end = min(start + size, text_length)
        chunk_text = text[start:end].strip()

        if chunk_text:
            chunks.append(
                DocumentChunk(
                    document_id=doc_id,
                    text=chunk_text,
                    chunk_index=chunk_index,
                    metadata={**metadata, "chunk_type": "fixed", "start_char": start, "end_char": end}
                )
            )
            chunk_index += 1

        if end >= text_length:
            break
        start += step

    return chunks


def recursive_chunks(
    text: str,
    doc_id: str = "doc_eval",
    size: int = 800,
    overlap: int = 100,
    separators: Optional[List[str]] = None,
    metadata: Optional[dict] = None
) -> List[DocumentChunk]:
    """Hierarchically splits text respecting structural separators (paragraphs, sentences).

    Attempts to split on primary separators (`\\n\\n`, `\\n`, `. `, ` `) in descending order.
    Combines smaller text segments up to `size` characters, preserving `overlap` where possible.

    Args:
        text: Raw document text content.
        doc_id: Parent document identifier.
        size: Target maximum character length per chunk.
        overlap: Target character overlap between consecutive chunks.
        separators: Custom list of separators to split on sequentially.
        metadata: Optional metadata dictionary to attach to chunks.

    Returns:
        List of DocumentChunk instances.
    """
    if not text or size <= 0:
        return []

    metadata = metadata or {}
    separators = separators or ["\n\n", "\n", ". ", " "]

    def _split_recursive(txt: str, seps: List[str]) -> List[str]:
        """Internal recursive helper to break text down by separator hierarchy."""
        if len(txt) <= size or not seps:
            return [txt]

        sep = seps[0]
        remaining_seps = seps[1:]

        splits = txt.split(sep)
        result: List[str] = []

        for segment in splits:
            if not segment.strip():
                continue
            if len(segment) > size:
                # Recursively split large segments with the next finer separator
                result.extend(_split_recursive(segment, remaining_seps))
            else:
                result.append(segment)

        return result

    raw_segments = _split_recursive(text, separators)

    # Merge small segments into target size chunks with overlap
    chunks: List[DocumentChunk] = []
    current_chunk_text = ""
    chunk_index = 0

    for segment in raw_segments:
        segment = segment.strip()
        if not segment:
            continue

        if not current_chunk_text:
            current_chunk_text = segment
        elif len(current_chunk_text) + len(segment) + 1 <= size:
            current_chunk_text += " " + segment
        else:
            # Finalize current chunk
            chunks.append(
                DocumentChunk(
                    document_id=doc_id,
                    text=current_chunk_text,
                    chunk_index=chunk_index,
                    metadata={**metadata, "chunk_type": "recursive", "char_length": len(current_chunk_text)}
                )
            )
            chunk_index += 1

            # Prepare next chunk incorporating overlap from the end of current_chunk_text
            if overlap > 0 and len(current_chunk_text) > overlap:
                overlap_text = current_chunk_text[-overlap:]
                current_chunk_text = overlap_text + " " + segment
            else:
                current_chunk_text = segment

    # Append any remaining text
    if current_chunk_text.strip():
        chunks.append(
            DocumentChunk(
                document_id=doc_id,
                text=current_chunk_text.strip(),
                chunk_index=chunk_index,
                metadata={**metadata, "chunk_type": "recursive", "char_length": len(current_chunk_text)}
            )
        )

    return chunks
