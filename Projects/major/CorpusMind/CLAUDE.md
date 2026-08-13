# CorpusMind - Project Instructions & Guidelines

> 🚨 **SYSTEM INSTRUCTION FOR AI AGENTS & DEVELOPERS:**  
> Before reading, writing, refactoring, or modifying any code in this repository, you **MUST ALWAYS READ AND ADHERE TO**:
> 1. [`code_rules.md`](code_rules.md) — Mandatory coding standards, OOP design rules, comprehensive documentation, modularity, and performance optimization guidelines.
> 2. [`CORPUSMIND.md`](CORPUSMIND.md) — Project specification, architecture design, component model, and measurable outcome metrics.

---

## 📌 Project Overview
**CorpusMind** is an enterprise-grade, high-performance RAG and Knowledge Intelligence engine designed for semantic search, vector indexing, graph reasoning, and contextual LLM generation over massive document & codebase corpora.

---

## 🛠️ Mandatory Engineering Rules
- **Documentation:** Every module, class, interface, and function must have explicit docstrings and type annotations. Comments must explain *why* non-obvious choices were made.
- **Object-Oriented & Modular:** Structure core domain logic using clean OOP interfaces, SOLID principles, and decoupled packages (`corpusmind/core`, `corpusmind/retrieval`, `corpusmind/storage`, `corpusmind/api`).
- **Optimization:** Ensure vector operations, search indexes, and memory usage are optimized for low latency and high concurrency.
- **Architectural Soundness:** Follow Clean Architecture principles; justify all engineering decisions and trade-offs clearly.
