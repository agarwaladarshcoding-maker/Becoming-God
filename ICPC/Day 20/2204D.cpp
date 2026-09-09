#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n, m;
    cin >> n >> m;
    
    vector<vector<long long>> adjList(n + 1);
    for (int i = 0; i < m; i++) {
        long long u, v;
        cin >> u >> v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    
    // -1 means unvisited, 0 and 1 are the two bipartite colors
    vector<int> color(n + 1, -1);
    long long ans = 0;
    
    for (int i = 1; i <= n; i++) {
        if (color[i] == -1) {
            long long count0 = 0, count1 = 0;
            bool isBipartite = true;
            queue<int> q;
            
            q.push(i);
            color[i] = 0;
            
            while (!q.empty()) {
                int curr = q.front();
                q.pop();
                
                if (color[curr] == 0) count0++;
                else count1++;
                
                for (int nbr : adjList[curr]) {
                    if (color[nbr] == -1) {
                        // Assign the opposite color to the neighbor
                        color[nbr] = 1 - color[curr];
                        q.push(nbr);
                    } 
                    else if (color[nbr] == color[curr]) {
                        // If neighbor has the same color, it's not bipartite (odd cycle found)
                        isBipartite = false;
                    }
                }
            }
            
            // If the component is bipartite, add the maximum of the two sets
            if (isBipartite) {
                ans += max(count0, count1);
            }
        }
    }
    cout << ans << '\n';
}

int main() {
    fast_io;
    int t;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}