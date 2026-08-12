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
void getTopo(long long i , vector<long long >&inOrder, vector<vector<long long>>&adjList, vector<long long> &topo, vector<bool> &visited){
    queue<long long> q;
    q.push(i);
    while(!q.empty()){
        auto temp = q.front();
        q.pop();
        visited[temp] = true;
        topo.push_back(temp);
        for(auto nbr : adjList[temp]){
            inOrder[nbr]--;
            if(inOrder[nbr]==0){
                q.push(nbr);
            }
        }
    }
}
void solve() {
    long long nodes;
    long long edges;
    cin>>nodes>>edges;
    vector<vector<long long> > adjList(nodes+1);
    vector<vector<long long>> revAdjList(nodes+1);
    vector<long long> inOrder(nodes+1, 0);
    for(int i = 0;i<edges;i++){
        long long u;
        long long v;
        cin>>u>>v;
        adjList[u].push_back(v);
        inOrder[v]++;
    }
    vector<long long> topo;
    vector<bool> visited(nodes+1, false);
    for(int i = 1;i<=nodes;i++){
        if(inOrder[i]==0&&visited[i]==false){
        getTopo(i, inOrder, adjList, topo, visited);
        }
    }
   
    vector<long long> dp(nodes+1, 0);
    for(int i = 0;i<topo.size();i++){
        long long current = topo[i];
        for(auto child : adjList[current]){
            dp[child] = max(dp[child], 1 + dp[current]);
        }
        
    }
    long long ans = 0;
    for(int i = 1;i<=nodes;i++){
        ans = max(ans, dp[i]);
    }
    cout<<ans<<'\n';


}

int main() {
    fast_io;
    solve();
    return 0;
}