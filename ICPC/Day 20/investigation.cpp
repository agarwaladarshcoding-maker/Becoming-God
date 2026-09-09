#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)
const long long MOD = 1e9+7;
const long long INF = 2e18; // Use a proper long long infinity

void solve() {
    long long n, m;
    if (!(cin >> n >> m)) return;
    
    vector<vector<pair<long long, long long>>> adjList(n+1);
    for(int i = 0; i < m; i++){
        long long u, v, w;
        cin >> u >> v >> w;
        adjList[u].push_back({v, w});
    }
    
    vector<long long> dist(n+1, INF);
    vector<long long> ways(n+1, 0);
    vector<long long> minFlights(n+1, 0);
    vector<long long> maxFlights(n+1, 0);
    
    // 1. Base cases for the starting node
    dist[1] = 0;
    ways[1] = 1; 
    
    priority_queue<pair<long long, long long>, vector<pair<long long, long long>>, greater<pair<long long, long long>>> pq;
    pq.push({0, 1});
    
    while(!pq.empty()){
        long long d = pq.top().first;
        long long parent = pq.top().second;
        pq.pop();
        
        if(d > dist[parent]){
            continue;
        }
        
        for(auto edges : adjList[parent]){
            long long v = edges.first;
            long long w = edges.second;
            
            if(dist[v] > dist[parent] + w){
                dist[v] = dist[parent] + w;
                pq.push({dist[v], v});
                
                // 2. Inherit values directly from the parent for a newly found shortest path
                ways[v] = ways[parent];
                minFlights[v] = minFlights[parent] + 1;
                maxFlights[v] = maxFlights[parent] + 1;
            }
            else if(dist[v] == dist[parent] + w){
                // 3. Accumulate paths and compare min/max flights for equal distances
                ways[v] = (ways[v] + ways[parent]) % MOD;
                minFlights[v] = min(minFlights[v], minFlights[parent] + 1);
                maxFlights[v] = max(maxFlights[v], maxFlights[parent] + 1);
            }
        }
    }
    
    // 4. Added missing space
    cout << dist[n] << ' ' << ways[n] << ' ' << minFlights[n] << ' ' << maxFlights[n] << '\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}