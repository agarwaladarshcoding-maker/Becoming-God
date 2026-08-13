# System Instruction & Code Guidelines

> 🚨 **SYSTEM INSTRUCTION FOR AI AGENTS & DEVELOPERS:**  
> **ALWAYS read and comply with this document (`code_rules.md`) before reading, writing, refactoring, or modifying any code in this repository.** Every pull request, feature implementation, and code modification must strictly adhere to the guidelines outlined below.

---

## Core Engineering Principles & Architecture Rules

### 1. 📖 Comprehensive Documentation
- **Mandatory Documentation:** Every module, class, interface, and function must have clear, concise docstrings/JSDoc/godoc as appropriate for the language.
- **Explain the "Why":** Comments should explain non-obvious design choices, business logic, edge cases, and architectural decisions—not just restate the code.
- **Up-to-Date Docs:** Keep documentation, READMEs, and inline comments perfectly synchronized with code updates.

### 2. 🧩 Object-Oriented & Design Patterns (OOP)
- **Object-Oriented Design:** Structure core domain logic around well-defined objects, classes, and interfaces where appropriate.
- **SOLID Principles:**
  - **Single Responsibility Principle (SRP):** Each class/module must have one, and only one, reason to change.
  - **Open/Closed Principle (OCP):** Software entities should be open for extension, but closed for modification.
  - **Liskov Substitution Principle (LSP):** Subtypes must be substitutable for their base types without altering correctness.
  - **Interface Segregation Principle (ISP):** Prefer small, client-specific interfaces over large, general-purpose ones.
  - **Dependency Inversion Principle (DIP):** Depend upon abstractions, not concrete implementations.
- **Encapsulation & Abstraction:** Hide implementation details behind clean interfaces and public APIs. Expose only what is necessary.

### 3. 📦 Modularity & Separation of Concerns
- **High Cohesion & Low Coupling:** Group related functionality into isolated, independent modules. Keep dependencies explicit and localized.
- **Layered Architecture:** Separate concerns cleanly (e.g., Presentation / API Layer, Domain / Business Logic, Data Access / Infrastructure).
- **Reusability:** Build reusable, self-contained components and utility services without tight coupling to context.

### 4. ⚡ Optimization & Performance
- **Efficient Execution:** Choose optimal algorithms and data structures for computational time and space complexity.
- **Resource Management:** Handle database connections, memory, network calls, and I/O efficiently (using caching, asynchronous execution, and stream processing where appropriate).
- **Pragmatic Optimization:** Design with performance and scalability in mind from the start. Avoid unnecessary allocations, redundant database queries, and blocking operations.

### 5. 🛠️ Maintainability & Scalability
- **Easily Manageable:** Keep code structured so individual modules can be tested, refactored, or replaced without causing side effects across the system.
- **DRY (Don't Repeat Yourself):** Avoid duplicated code or logic. Abstract repetitive functionality into shared components or utilities.
- **Configuration Management:** Keep configuration separate from code (environment variables, structured config files). Never hardcode secrets or magic constants.

### 6. ✨ Clarity, Cleanliness & Readability
- **Self-Documenting Code:** Use meaningful, intent-revealing names for variables, methods, classes, and files. Avoid cryptic abbreviations.
- **Low Cognitive Load:** Keep functions short and focused on a single logical task. Avoid deep nesting and complex conditional branches.
- **Consistent Style:** Follow standard formatting, type annotations, and linting guidelines consistently across the repository.

### 7. 🏛️ Best Architecture & Sound Technical Reasoning
- **Architectural Integrity:** Follow industry-standard architectural blueprints suitable for the project scope (e.g., Clean Architecture, Domain-Driven Design).
- **Justified Engineering Decisions:** Every technical decision, third-party library inclusion, or design choice must be backed by sound, explicit engineering reasoning. Evaluate trade-offs (simplicity vs. flexibility, performance vs. readability) deliberately.
