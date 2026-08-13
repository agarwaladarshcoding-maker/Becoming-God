"""Evaluation package for document chunking bake-off comparisons."""

from corpusmind.eval.chunkers import fixed_chunks, recursive_chunks
from corpusmind.eval.bakeoff import BakeoffEvaluator

__all__ = ["fixed_chunks", "recursive_chunks", "BakeoffEvaluator"]
