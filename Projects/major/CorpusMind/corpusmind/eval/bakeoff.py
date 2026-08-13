"""Bakeoff Evaluator comparing Fixed-Size vs Recursive Hierarchical Chunking.

This module loads evaluation PDFs, parses raw text, generates chunks using both
strategies, indexes chunks into a vector retriever, and evaluates retrieval performance
against standard IR metrics (Recall@K, MRR, Top Similarity) using gold standard questions.

Design Rationale:
- Follows Object-Oriented Evaluation Harness design (BakeoffEvaluator).
- Uses a deterministic TF-IDF Vectorizer to ensure fast, reproducible benchmarks without
  external network or API model dependencies.
- Produces clean tabular metrics output comparing chunking strategies side-by-side.
"""

import math
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple
import yaml
from pypdf import PdfReader

from corpusmind.core.document import DocumentChunk
from corpusmind.eval.chunkers import fixed_chunks, recursive_chunks


@dataclass
class EvalQuestion:
    """Represents a ground-truth evaluation benchmark item."""
    id: int
    question: str
    source_file: str
    gold_snippet: str


@dataclass
class StrategyMetrics:
    """Holds computed evaluation metrics for a chunking strategy."""
    strategy_name: str
    total_chunks: int
    avg_chunk_length: float
    recall_at_1: float
    recall_at_3: float
    recall_at_5: float
    mrr: float
    avg_similarity: float


class SimpleTFIDFRetriever:
    """Fast, deterministic TF-IDF vector retriever for chunk evaluation."""

    def __init__(self, chunks: List[DocumentChunk]):
        self.chunks = chunks
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.chunk_vectors: List[Dict[int, float]] = []
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        """Tokenizes text into lowercase alphanumeric terms."""
        return re.findall(r'\b[a-zA-Z0-9]+\b', text.lower())

    def _build_index(self) -> None:
        """Builds TF-IDF index across all document chunks."""
        if not self.chunks:
            return

        doc_frequencies: Dict[str, int] = {}
        total_docs = len(self.chunks)
        term_docs: List[List[str]] = []

        for chunk in self.chunks:
            tokens = self._tokenize(chunk.text)
            unique_terms = set(tokens)
            term_docs.append(tokens)

            for term in unique_terms:
                doc_frequencies[term] = doc_frequencies.get(term, 0) + 1

        # Assign vocabulary IDs
        for idx, term in enumerate(doc_frequencies.keys()):
            self.vocabulary[term] = idx
            # Calculate IDF with smoothing
            self.idf[term] = math.log((total_docs + 1) / (doc_frequencies[term] + 1)) + 1.0

        # Calculate TF-IDF vectors for each chunk
        for tokens in term_docs:
            term_counts: Dict[str, int] = {}
            for t in tokens:
                term_counts[t] = term_counts.get(t, 0) + 1

            vec: Dict[int, float] = {}
            norm_sq = 0.0
            for term, count in term_counts.items():
                if term in self.vocabulary:
                    term_id = self.vocabulary[term]
                    tfidf_val = count * self.idf[term]
                    vec[term_id] = tfidf_val
                    norm_sq += tfidf_val ** 2

            # L2 Normalize
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            for term_id in vec:
                vec[term_id] /= norm

            self.chunk_vectors.append(vec)

    def query(self, query_text: str, top_k: int = 5) -> List[Tuple[DocumentChunk, float]]:
        """Queries the TF-IDF index and returns top-K ranked (chunk, score) tuples."""
        tokens = self._tokenize(query_text)
        term_counts: Dict[str, int] = {}
        for t in tokens:
            term_counts[t] = term_counts.get(t, 0) + 1

        query_vec: Dict[int, float] = {}
        norm_sq = 0.0
        for term, count in term_counts.items():
            if term in self.vocabulary:
                term_id = self.vocabulary[term]
                tfidf_val = count * self.idf[term]
                query_vec[term_id] = tfidf_val
                norm_sq += tfidf_val ** 2

        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        for term_id in query_vec:
            query_vec[term_id] /= norm

        # Cosine similarity dot product
        scores: List[Tuple[int, float]] = []
        for idx, chunk_vec in enumerate(self.chunk_vectors):
            score = 0.0
            for term_id, val in query_vec.items():
                if term_id in chunk_vec:
                    score += val * chunk_vec[term_id]
            scores.append((idx, score))

        # Sort descending by score
        scores.sort(key=lambda x: x[1], reverse=True)
        return [(self.chunks[idx], score) for idx, score in scores[:top_k]]


class BakeoffEvaluator:
    """Evaluates and compares document chunking strategies over PDF corpora."""

    def __init__(self, pdf_dir: str = "data/pdfs", questions_path: str = "corpusmind/eval/questions.yaml"):
        self.pdf_dir = pdf_dir
        self.questions_path = questions_path
        self.documents: Dict[str, str] = {}
        self.questions: List[EvalQuestion] = []

    def load_corpus(self) -> None:
        """Loads PDF files from pdf_dir and extracts full text content."""
        if not os.path.exists(self.pdf_dir):
            raise FileNotFoundError(f"PDF directory not found: {self.pdf_dir}")

        pdf_files = [f for f in os.listdir(self.pdf_dir) if f.endswith(".pdf")]
        for pdf_file in pdf_files:
            filepath = os.path.join(self.pdf_dir, pdf_file)
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"

            self.documents[pdf_file] = text.strip()

    def load_questions(self) -> None:
        """Loads evaluation questions and ground truth from YAML."""
        if not os.path.exists(self.questions_path):
            raise FileNotFoundError(f"Questions YAML not found: {self.questions_path}")

        with open(self.questions_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        for q in data.get("questions", []):
            self.questions.append(
                EvalQuestion(
                    id=q["id"],
                    question=q["question"],
                    source_file=q["source_file"],
                    gold_snippet=q["gold_snippet"]
                )
            )

    def _is_match(self, chunk: DocumentChunk, question: EvalQuestion) -> bool:
        """Checks if a retrieved chunk matches the gold snippet or source document."""
        # Match condition: chunk comes from target source file AND contains core gold snippet tokens
        is_source_match = chunk.metadata.get("source_file") == question.source_file
        if not is_source_match:
            return False

        # Token overlap check between gold snippet and chunk text
        gold_tokens = set(re.findall(r'\b[a-zA-Z0-9]{4,}\b', question.gold_snippet.lower()))
        chunk_tokens = set(re.findall(r'\b[a-zA-Z0-9]{4,}\b', chunk.text.lower()))

        overlap_ratio = len(gold_tokens.intersection(chunk_tokens)) / max(1, len(gold_tokens))
        return overlap_ratio >= 0.5

    def evaluate_strategy(self, strategy_name: str, chunk_fn) -> StrategyMetrics:
        """Runs evaluation for a specific chunking strategy."""
        all_chunks: List[DocumentChunk] = []

        for filename, text in self.documents.items():
            chunks = chunk_fn(text=text, doc_id=filename, size=800, overlap=100, metadata={"source_file": filename})
            all_chunks.extend(chunks)

        retriever = SimpleTFIDFRetriever(all_chunks)

        recall_1_hits = 0
        recall_3_hits = 0
        recall_5_hits = 0
        reciprocal_ranks: List[float] = []
        similarity_scores: List[float] = []

        for q in self.questions:
            top_results = retriever.query(q.question, top_k=5)
            if top_results:
                similarity_scores.append(top_results[0][1])

            hit_rank = 0
            for rank_idx, (chunk, _score) in enumerate(top_results, start=1):
                if self._is_match(chunk, q):
                    hit_rank = rank_idx
                    break

            if hit_rank == 1:
                recall_1_hits += 1
            if 1 <= hit_rank <= 3:
                recall_3_hits += 1
            if 1 <= hit_rank <= 5:
                recall_5_hits += 1

            reciprocal_ranks.append(1.0 / hit_rank if hit_rank > 0 else 0.0)

        total_questions = len(self.questions)
        avg_len = sum(len(c.text) for c in all_chunks) / max(1, len(all_chunks))

        return StrategyMetrics(
            strategy_name=strategy_name,
            total_chunks=len(all_chunks),
            avg_chunk_length=round(avg_len, 2),
            recall_at_1=round(recall_1_hits / total_questions, 4),
            recall_at_3=round(recall_3_hits / total_questions, 4),
            recall_at_5=round(recall_5_hits / total_questions, 4),
            mrr=round(sum(reciprocal_ranks) / total_questions, 4),
            avg_similarity=round(sum(similarity_scores) / max(1, len(similarity_scores)), 4)
        )

    def run_bakeoff(self) -> None:
        """Executes full bake-off benchmark and prints Markdown comparison table."""
        self.load_corpus()
        self.load_questions()

        fixed_metrics = self.evaluate_strategy("Fixed Chunks (800 / 100)", fixed_chunks)
        recursive_metrics = self.evaluate_strategy("Recursive Chunks (800 / 100)", recursive_chunks)

        print("\n" + "=" * 80)
        print(" 🔥 CORPUSMIND CHUNKING BAKEOFF EVALUATION RESULTS 🔥")
        print("=" * 80 + "\n")

        headers = ["Metric", "Fixed Chunks (800/100)", "Recursive Chunks (800/100)", "Winner"]
        rows = [
            ["Total Chunks", f"{fixed_metrics.total_chunks}", f"{recursive_metrics.total_chunks}", "-" ],
            ["Avg Chunk Length (chars)", f"{fixed_metrics.avg_chunk_length}", f"{recursive_metrics.avg_chunk_length}", "-"],
            ["Recall @ 1", f"{fixed_metrics.recall_at_1 * 100:.1f}%", f"{recursive_metrics.recall_at_1 * 100:.1f}%", "Recursive" if recursive_metrics.recall_at_1 >= fixed_metrics.recall_at_1 else "Fixed"],
            ["Recall @ 3", f"{fixed_metrics.recall_at_3 * 100:.1f}%", f"{recursive_metrics.recall_at_3 * 100:.1f}%", "Recursive" if recursive_metrics.recall_at_3 >= fixed_metrics.recall_at_3 else "Fixed"],
            ["Recall @ 5", f"{fixed_metrics.recall_at_5 * 100:.1f}%", f"{recursive_metrics.recall_at_5 * 100:.1f}%", "Recursive" if recursive_metrics.recall_at_5 >= fixed_metrics.recall_at_5 else "Fixed"],
            ["Mean Reciprocal Rank (MRR)", f"{fixed_metrics.mrr:.4f}", f"{recursive_metrics.mrr:.4f}", "Recursive" if recursive_metrics.mrr >= fixed_metrics.mrr else "Fixed"],
            ["Avg Top Cosine Sim", f"{fixed_metrics.avg_similarity:.4f}", f"{recursive_metrics.avg_similarity:.4f}", "Recursive" if recursive_metrics.avg_similarity >= fixed_metrics.avg_similarity else "Fixed"],
        ]

        # Format ASCII Markdown Table
        col_widths = [max(len(str(r[i])) for r in [headers] + rows) + 2 for i in range(len(headers))]

        def format_row(row):
            return "| " + " | ".join(f"{str(val):<{col_widths[idx]}}" for idx, val in enumerate(row)) + " |"

        separator = "|-" + "-|-".join("-" * col_widths[idx] for idx in range(len(headers))) + "-|"

        print(format_row(headers))
        print(separator)
        for r in rows:
            print(format_row(r))

        print("\n" + "=" * 80)
        print(" Summary Rationale:")
        print(" Recursive chunking retains paragraph and sentence boundaries, avoiding mid-sentence")
        print(" splits and preserving semantic integrity for Information Retrieval.")
        print("=" * 80 + "\n")


if __name__ == "__main__":
    evaluator = BakeoffEvaluator()
    evaluator.run_bakeoff()
