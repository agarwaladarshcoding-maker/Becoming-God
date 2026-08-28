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

void solve() {
    int n;
    int m;
    int k;
    cin>>n>>m>>k;
    vector<int> arr(n+1);
    for(int i = 0;i<n;i++){
        cin>>arr[i+1];
    }
    vector<int> ans(k+1, 0);
    vector<vector<int>> adjList(n+1);
    for(int i= 0;i<m;i++){
        int u;
        int v;
        cin>>u>>v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    queue<int> pending;
    vector<int> dist(n+1, -1);
    dist[1] = 0;
    pending.push(1);
    while (!pending.empty()) {
        int parent = pending.front();
        pending.pop();
        for(auto nbr: adjList[parent]){
            if (dist[nbr] == -1) {
                dist[nbr] = dist[parent] +1;
                pending.push(nbr);
            }
        }
    }

    for(int i = 1;i<=n;i++){
        int typed = arr[i];
        int distance = dist[i];
        ans[typed] = max(ans[typed], distance);
    }
    for(int i = 1;i<=k;i++){
        cout<<ans[i]<<' ';
    }


}

int main() {
    fast_io;
    solve();
    return 0;
}