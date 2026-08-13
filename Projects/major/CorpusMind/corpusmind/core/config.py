"""System configuration management."""

from pydantic import BaseModel, ConfigDict, Field


class SystemConfig(BaseModel):
    """Global configuration settings for CorpusMind."""

    model_config = ConfigDict(frozen=True)

    chunk_size: int = Field(default=800, description="Default character length for chunks.")
    chunk_overlap: int = Field(default=100, description="Default character overlap for chunks.")
    top_k: int = Field(default=5, description="Default number of retrieved context chunks.")
    rrf_k: int = Field(default=60, description="Reciprocal Rank Fusion constant parameter.")
