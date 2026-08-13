"""Utility script to generate 10 real technical PDF documents in data/pdfs/ for evaluation."""

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

PDF_DIR = "data/pdfs"
os.makedirs(PDF_DIR, exist_ok=True)

PDF_CONTENTS = [
    {
        "filename": "doc_01_rag_architecture.pdf",
        "title": "Retrieval-Augmented Generation Architecture Overview",
        "sections": [
            ("Introduction to RAG", "Retrieval-Augmented Generation (RAG) merges parametric knowledge from large language models with non-parametric knowledge from external document stores. By querying external indexes, RAG mitigates hallucinations and enables real-time domain adaptation without expensive fine-tuning."),
            ("Vector Indexing & Embeddings", "Dense vector indexing relies on embedding models such as BERT, RoBERTa, or OpenAI text-embedding-3 to project documents into low-dimensional vector spaces. Nearby vectors correspond to semantically similar texts, enabling nearest-neighbor retrieval via HNSW or IVF indexes."),
            ("Context Assembly & Grounding", "Retrieved document chunks are injected into the LLM prompt context window. Grounding constraints force the model to cite specific sources and restrict response generation strictly to facts present in the retrieved context.")
        ]
    },
    {
        "filename": "doc_02_vector_indexing.pdf",
        "title": "Vector Search Algorithms and Graph Indexing",
        "sections": [
            ("HNSW Graph Indexing", "Hierarchical Navigable Small World (HNSW) graphs construct multi-layer proximity graphs for approximate nearest neighbor (ANN) search. HNSW achieves logarithmic search time complexity O(log N) while maintaining over 95% recall on high-dimensional vector spaces."),
            ("Distance Metrics Comparison", "Cosine similarity measures vector angle regardless of magnitude, Euclidean distance computes L2 geometric distance, and Dot Product evaluates unnormalized projection. Normalized vectors make Dot Product identical to Cosine similarity for BLAS acceleration."),
            ("Quantization Techniques", "Product Quantization (PQ) and Scalar Quantization (SQ8) compress 32-bit floating-point embeddings into 8-bit or 4-bit codes, reducing RAM consumption by 75% with minimal accuracy degradation.")
        ]
    },
    {
        "filename": "doc_03_graph_reasoning.pdf",
        "title": "Knowledge Graph Traversal and Entity Extraction",
        "sections": [
            ("Graph RAG Concepts", "Knowledge Graph RAG supplements dense embeddings by capturing explicit entity relationships (subject-predicate-object triples). Graph structures maintain structural integrity across multi-hop inference paths where semantic vector similarity falls short."),
            ("Entity & Relation Extraction", "NER models and LLM extractors scan unstructured text to identify core entities and directed edges. Extracted knowledge triples are stored in graph databases like Neo4j or NetworkX for relational query execution."),
            ("Sub-graph Retrieval", "During retrieval, seed entities identified in the user prompt are expanded via personalized PageRank or breadth-first search (BFS) to construct a context sub-graph.")
        ]
    },
    {
        "filename": "doc_04_reciprocal_rank_fusion.pdf",
        "title": "Reciprocal Rank Fusion and Hybrid Retrieval",
        "sections": [
            ("Hybrid Retrieval Motivation", "Neither vector search nor keyword search is optimal for all query types. Sparse BM25 excels at exact keyword matching (part numbers, technical terms), while dense vector search captures conceptual semantics."),
            ("RRF Formula & Algorithm", "Reciprocal Rank Fusion (RRF) combines ranked lists from multiple independent retrievers without requiring score normalization. RRF calculates a final score for each document using the sum of reciprocal ranks: RRF_score(d) = sum(1 / (k + r_i(d))), where k is a constant parameter (typically 60) and r_i(d) is document d's rank in retriever i."),
            ("Evaluation & Benefits", "RRF improves Mean Reciprocal Rank (MRR) and NDCG@10 by up to 18% over single-retriever baselines across diverse benchmarks.")
        ]
    },
    {
        "filename": "doc_05_ast_parsing.pdf",
        "title": "AST-Aware Code Chunker Design for Codebases",
        "sections": [
            ("Abstract Syntax Trees in RAG", "Traditional character-based chunking breaks code mid-function or across class boundaries, destroying syntactic context. AST parsers parse source code into tree nodes representing classes, methods, and functions."),
            ("Tree-Sitter Integration", "Tree-Sitter generates concrete syntax trees for Python, TypeScript, and C++. AST-based chunking splits source code along clean AST nodes, maintaining function signatures and docstrings intact."),
            ("Scope-Aware Context", "Every AST chunk retains parent scope headers (e.g. enclosing class name and package imports) so LLMs receive fully qualified context.")
        ]
    },
    {
        "filename": "doc_06_cross_encoders.pdf",
        "title": "Cross-Encoder Re-Ranking for High Precision Retrieval",
        "sections": [
            ("Bi-Encoders vs Cross-Encoders", "Bi-encoders encode queries and documents independently for fast ANN search. Cross-encoders process query and document pairs simultaneously through full self-attention layers, capturing complex token-level interactions."),
            ("Two-Stage Retrieval Pipeline", "First-stage candidate retrieval fetches top-100 candidates via fast vector/BM25 search. Second-stage cross-encoders re-rank candidate pairs to select top-5 high-precision context chunks for LLM inference."),
            ("Latency and Throughput Trade-offs", "Cross-encoders incur O(N) inference cost per query. Batching and GPU acceleration keep re-ranking latency under 30ms for 50 candidate documents.")
        ]
    },
    {
        "filename": "doc_07_eval_metrics.pdf",
        "title": "Evaluation Frameworks and RAG Triad Metrics",
        "sections": [
            ("The RAG Triad Metrics", "Evaluating RAG systems requires measuring three orthogonal dimensions: Context Relevance (is retrieved context pertinent?), Groundedness (is response supported by context?), and Answer Relevance (does response answer query?)."),
            ("Automated LLM-as-a-Judge", "Frameworks like Ragas and TruLens employ GPT-4 or Claude as an evaluator to score prompt-context alignment and detect hallucinations systematically."),
            ("IR Ground-Truth Benchmarking", "Retrieval performance is benchmarked against gold snippets using Recall@K, Precision@K, Mean Reciprocal Rank (MRR), and Normalized Discounted Cumulative Gain (NDCG).")
        ]
    },
    {
        "filename": "doc_08_embedding_models.pdf",
        "title": "Embedding Model Selection and Fine-Tuning",
        "sections": [
            ("Dense Representation Dimensions", "Modern embedding models produce vectors ranging from 384 dimensions (MiniLM) to 1536 (OpenAI text-embedding-3-small) or 3072 dimensions (text-embedding-3-large). Higher dimensions capture finer semantic nuances at higher storage cost."),
            ("Domain-Specific Fine-Tuning", "Multiple Negatives Ranking Loss (MNRL) and Matryoshka Representation Learning allow fine-tuning embeddings on domain-specific pair datasets (query, positive_doc, negative_doc)."),
            ("Matryoshka Embeddings", "Matryoshka embeddings enable dynamic truncation of vector dimensions (e.g. 1536 -> 256) with under 2% degradation in retrieval accuracy.")
        ]
    },
    {
        "filename": "doc_09_distributed_storage.pdf",
        "title": "Distributed Vector and Graph Storage Architecture",
        "sections": [
            ("Sharding and Partitioning", "Scaling vector stores to billions of vectors requires consistent hashing and metadata-based partitioning across distributed nodes."),
            ("Replication & Consistency", "Raft consensus protocol manages leader election and index state replication, guaranteeing linearizable reads and high availability during node failures."),
            ("Hybrid Storage Engines", "Modern vector engines store high-dimensional indexes in RAM/NVMe SSDs while offloading raw document text to object storage like AWS S3 or MinIO.")
        ]
    },
    {
        "filename": "doc_10_llm_synthesis.pdf",
        "title": "LLM Synthesis and Citation Grounding",
        "sections": [
            ("Prompt Engineering for Synthesis", "Prompt templates instruct the LLM to synthesize concise answers directly referencing bracketed citations [Doc X, Chunk Y] corresponding to retrieved context."),
            ("Streaming Responses & Server-Sent Events", "RAG systems stream response tokens back to users via Server-Sent Events (SSE) or WebSockets, reducing Time-To-First-Token (TTFT) to under 300ms."),
            ("Hallucination Mitigation", "Post-processing verification checks generated claims against source citations, redacting ungrounded statements prior to client delivery.")
        ]
    }
]

def generate_pdfs():
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        spaceAfter=14
    )
    heading_style = ParagraphStyle(
        'DocHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        spaceAfter=8,
        spaceBefore=12
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=10
    )

    for item in PDF_CONTENTS:
        filepath = os.path.join(PDF_DIR, item["filename"])
        doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
        story = []

        # Add Title
        story.append(Paragraph(item["title"], title_style))
        story.append(Spacer(1, 10))

        # Add Sections
        for heading, body in item["sections"]:
            story.append(Paragraph(heading, heading_style))
            story.append(Paragraph(body, body_style))
            story.append(Spacer(1, 6))

        doc.build(story)
        print(f"Generated PDF: {filepath}")

if __name__ == "__main__":
    generate_pdfs()
