# `dfs.cpp` – Depth‑First Search Traversal for Undirected Graphs  

## Table of Contents
1. [Purpose & High‑Level Overview](#purpose--high-level-overview)  
2. [Key Functions & Their Behavior](#key-functions--their-behavior)  
3. [Program Input, Output & Side Effects](#program-input-output--side-effects)  
4. [Implementation Details & Complexity Analysis](#implementation-details--complexity-analysis)  
5. [Potential Improvements & Caveats](#potential-improvements--caveats)  
6. [Full Source Listing (for reference)](#full-source-listing)  

---

## Purpose & High‑Level Overview
This program reads an undirected graph (specified by the number of vertices and edges) and performs a **full depth‑first search (DFS)** traversal, visiting every connected component.  
The order in which vertices are visited (starting from vertex 1 and proceeding to the next unvisited vertex) is printed to standard output, separated by spaces.

Typical use‑cases:
- Demonstrating recursive DFS on a simple adjacency‑list representation.
- Generating a visitation order for debugging or teaching graph algorithms.
- A building block for more advanced graph problems (e.g., connectivity, components, topological ordering).

---

## Key Functions & Their Behavior  

| Function | Signature | Description |
|----------|-----------|-------------|
| `dfs` | `void dfs(long long i, vector<vector<long long>>& adjList, vector<bool>& visited, vector<long long>& ans)` | Recursively explores the component that contains vertex `i`. <br> • Marks `i` as visited.<br> • Appends `i` to the global visitation list `ans`.<br> • Recursively visits all unvisited neighbours in `adjList[i]`. |
| `solve` | `void solve()` | Handles all I/O and orchestrates the traversal.<br> • Reads `vertices` and `edges`.<br> • Builds an undirected adjacency list (`adjList`).<br> • Initializes a `visited` vector and an empty `ans` vector.<br> • Iterates over vertices `1 … vertices`; launches `dfs` for each unvisited vertex to cover all components.<br> • Prints the final visitation order. |
| `main` | `int main()` | Sets fast I/O, calls `solve()`, and returns `0`. |

### `dfs` – Detailed Steps
1. `visited[i] = true;` – Prevent revisiting the same vertex (essential for avoiding infinite recursion in cycles).  
2. `ans.push_back(i);` – Record the visit order.  
3. Loop through each neighbour `nbr` of `i` (`for (auto nbr : adjList[i])`).  
4. If `nbr` has not been visited, recursively invoke `dfs(nbr, ...)`.  

The function relies on **call‑stack depth** equal to the size of the current DFS tree branch.

---

## Program Input, Output & Side Effects  

| Aspect | Details |
|--------|---------|
| **Input** | - First line: two integers `vertices` ( ≥ 1) and `edges` ( ≥ 0). <br> - Next `edges` lines: each contains two integers `u v` representing an undirected edge between vertices `u` and `v`. <br> Vertices are assumed to be 1‑indexed. |
| **Output** | A single line containing the vertices in the order they were visited by DFS, separated by a single space. No trailing newline is required, but the program naturally ends with a newline due to `cout` buffering when the program exits. |
| **Side Effects** | - Uses global state only through local variables passed by reference (`visited`, `ans`). <br> - No file I/O, network calls, or modification of external resources. |
| **Error Handling** | The code assumes well‑formed input (valid vertex indices, non‑negative counts). No explicit validation is performed. |

---

## Implementation Details & Complexity Analysis  

### Data Structures
| Structure | Type | Purpose |
|-----------|------|---------|
| `adjList` | `vector<vector<long long>>` | Adjacency list; `adjList[u]` holds all neighbours of vertex `u`. |
| `visited` | `vector<bool>` | Marks whether a vertex has already been explored. |
| `ans` | `vector<long long>` | Stores the final visitation order. |

### Complexity  
- **Building the graph:** `O(V + E)` time, `O(V + E)` memory.  
- **DFS traversal:** Each vertex is visited once, each edge examined twice (once from each endpoint) → `O(V + E)` time, `O(V)` additional recursion stack (worst‑case depth = number of vertices in a single component).  
- **Overall:** `O(V + E)` time, `O(V + E)` memory.

### Recursion Depth
The recursive implementation may cause a stack overflow for very deep or line‑like graphs when `V` exceeds the typical recursion limit (~10⁵ on many systems). For competitive programming constraints (≤ 10⁵), the risk is moderate but still worth noting.

### Fast I/O
`#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)` disables synchronization with C I/O and unties `cin`/`cout` for faster input and output, which is beneficial for large graphs.

---

## Potential Improvements & Caveats  

| Area | Suggestion |
|------|------------|
| **Iterative DFS** | Replace recursion with an explicit stack (`std::stack<long long>`) to avoid stack‑overflow risk on large or pathological inputs. |
| **Vertex Indexing Flexibility** | Currently vertices are 1‑based. Accepting 0‑based graphs (or automatically detecting the minimum index) would make the program more reusable. |
| **Input Validation** | Add checks for out‑of‑range vertex IDs, duplicate edges, and negative values to make the program robust against malformed input. |
| **Deterministic Ordering** | The visitation order of neighbours follows the order they were inserted. Sorting each adjacency list (`std::sort(adjList[i].begin(), adjList[i].end())`) yields a lexicographically smallest DFS order, which can be required by some problem statements. |
| **Component Separation** | If the problem requires distinguishing separate connected components, store component identifiers or output a delimiter (e.g., newline) between components. |
| **Memory Optimisation** | For extremely sparse graphs, `vector<vector<int>>` with `int` indices (instead of `long long`) reduces memory. |
| **Return Value** | Instead of printing directly inside `solve`, return the `ans` vector and let `main` handle formatting; this improves testability. |
| **Const‑Correctness** | Pass `adjList` as `const vector<vector<long long>>&` to `dfs` (the function does not modify it) and mark `dfs` as `static` or place it inside an anonymous namespace to limit linkage. |
| **Naming & Documentation** | Use more expressive names (`vertexCount`, `edgeCount`, `graph`, `visited`, `order`) and add Doxygen‑style comments for automatic documentation generation. |

---

## Full Source Listing (for reference)

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

// Recursive depth‑first search on an undirected graph.
// i          – current vertex (1‑based)
// adjList    – adjacency list of the graph
// visited    – boolean vector tracking visited vertices
// ans        – vector collecting vertices in visitation order
void dfs(long long i,
         vector<vector<long long>>& adjList,
         vector<bool> &visited,
         vector<long long> &ans) {
    visited[i] = true;
    ans.push_back(i);
    for (auto nbr : adjList[i]) {
        if (visited[nbr] == false) {
            dfs(nbr, adjList, visited, ans);
        }
    }
}

// Reads a graph, runs DFS on all components, and prints the order.
void solve() {
    long long vertices;
    long long edges;
    cin >> vertices >> edges;

    // Build adjacency list (1‑based indexing)
    vector<vector<long long>> adjList(vertices + 1);
    for (int i = 0; i < edges; i++) {
        long long u, v;
        cin >> u >> v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }

    vector<bool> visited(vertices + 1, false);
    vector<long long> ans;

    // Launch DFS from every unvisited vertex to cover all components
    for (int i = 1; i <= vertices; i++) {
        if (visited[i] == false) {
            dfs(i, adjList, visited, ans);
        }
    }

    // Output the visitation sequence
    for (auto i : ans) {
        cout << i << ' ';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}
```

---  

*End of documentation.*