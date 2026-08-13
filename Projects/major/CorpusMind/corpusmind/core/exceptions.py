"""Core exceptions hierarchy for CorpusMind."""

class CorpusMindError(Exception):
    """Base exception for all CorpusMind errors."""
    pass

class IngestionError(CorpusMindError):
    """Raised when document loading or parsing fails."""
    pass

class StorageError(CorpusMindError):
    """Raised when vector or graph storage operations fail."""
    pass

class RetrievalError(CorpusMindError):
    """Raised during retrieval or query execution failures."""
    pass
