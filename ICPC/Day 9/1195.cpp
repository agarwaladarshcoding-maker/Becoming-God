#include <bits/stdc++.h>
using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

const long long INF = 1e18;

vector<long long> dijkstra(int start, const vector<vector<pair<int, long long>>>& graph) {
    int n = graph.size();
    vector<long long> dist(n, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    
    dist[start] = 0;
    pq.push({0, start});
    
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        
        if (d > dist[u]) continue;
        
        for (auto [v, w] : graph[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    
    return dist;
}

void solve() {
    int n, m;
    cin >> n >> m;
    
    vector<vector<pair<int, long long>>> graph(n + 1);
    vector<vector<pair<int, long long>>> reverse_graph(n + 1);
    vector<tuple<int, int, long long>> edges;
    
    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        graph[u].push_back({v, w});
        reverse_graph[v].push_back({u, w});
        edges.push_back({u, v, w});
    }
    
    // Dijkstra from source (node 1)
    vector<long long> dist_from_1 = dijkstra(1, graph);
    
    // Dijkstra from destination (node n) in reverse graph
    vector<long long> dist_to_n = dijkstra(n, reverse_graph);
    
    long long shortest_path = dist_from_1[n];
    long long answer = shortest_path;
    
    // Try making each edge free
    for (auto [u, v, w] : edges) {
        long long cost = dist_from_1[u] + dist_to_n[v];
        answer = min(answer, cost);
    }
    
    cout << answer << '\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}