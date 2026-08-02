#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
bool visited[MAXN];
int parent_node[MAXN];

// Variables to store the start and end of the cycle when we find it
int cycle_start = -1, cycle_end = -1;

bool dfs(int u, int p) {
    visited[u] = true;
    parent_node[u] = p;

    for (int v : adj[u]) {
        if (v == p) continue; // Prevents the 1->2->1 false loop

        if (visited[v]) {
            // Back-edge found! We have a cycle.
            cycle_end = u;
            cycle_start = v;
            return true;
        }

        if (!visited[v]) {
            if (dfs(v, u)) return true; // Stop searching once a cycle is found
        }
    }
    return false;
}

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // Graph might be disconnected, so check every unvisited node
    for (int i = 1; i <= n; i++) {
        if (!visited[i]) {
            if (dfs(i, 0)) {
                break; // Break completely out of the loop if we got one!
            }
        }
    }

    if (cycle_start == -1) {
        cout << "IMPOSSIBLE\n";
    } else {
        // Reconstruct the cycle
        vector<int> cycle;
        cycle.push_back(cycle_start); // The city we return to
        
        // Walk backwards from cycle_end to cycle_start using parent array
        for (int v = cycle_end; v != cycle_start; v = parent_node[v]) {
            cycle.push_back(v);
        }
        cycle.push_back(cycle_start); // Complete the round trip

        // Print results
        cout << cycle.size() << "\n";
        
        // We pushed backwards, so iterate backwards to print in correct order 
        // (Though for an undirected cycle, forwards/backwards doesn't strictly matter)
        for (int i = cycle.size() - 1; i >= 0; i--) {
            cout << cycle[i] << " ";
        }
        cout << "\n";
    }

    return 0;
}