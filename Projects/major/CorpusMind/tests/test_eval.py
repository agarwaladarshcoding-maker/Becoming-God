"""Unit tests for chunking algorithms and evaluation harness."""

import pytest
from corpusmind.eval.chunkers import fixed_chunks, recursive_chunks
from corpusmind.eval.bakeoff import BakeoffEvaluator


def test_fixed_chunks_basic():
    text = "Paragraph one is here. " * 50
    chunks = fixed_chunks(text, size=200, overlap=20)
    assert len(chunks) > 0
    for chunk in chunks:
        assert len(chunk.text) <= 200
        assert chunk.metadata["chunk_type"] == "fixed"


def test_recursive_chunks_sentence_boundaries():
    text = "Sentence 1 is long.\n\nSentence 2 is here.\n\nSentence 3 is another paragraph."
    # Small size forces splitting across paragraphs
    chunks = recursive_chunks(text, size=25, overlap=0)
    assert len(chunks) >= 3
    for chunk in chunks:
        assert chunk.metadata["chunk_type"] == "recursive"


def test_bakeoff_evaluator_execution():
    evaluator = BakeoffEvaluator()
    evaluator.load_corpus()
    evaluator.load_questions()
    assert len(evaluator.documents) == 10
    assert len(evaluator.questions) == 10

    metrics = evaluator.evaluate_strategy("Fixed Test", fixed_chunks)
    assert metrics.total_chunks > 0
    assert metrics.recall_at_1 >= 0.0
