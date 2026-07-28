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
void bfs(long long i,vector<vector<int>> adjList, vector<bool> &visited, vector<long long> &ans ){
    queue<long long> q;
    q.push(i);
    visited[i] = true;
    while(!q.empty()){
        long long parent = q.front();
        q.pop();
        ans.push_back(parent);
        for(auto nbr: adjList[parent]){
            if(visited[nbr]==false){
                q.push(nbr);
                visited[nbr] = true;
            }
        }

    }
}
void solve() {
    long long vertices;
    cin>>vertices;
    long long edges;
    cin>>edges;
    vector<vector<int>> adjList(vertices+1);
    for(int i= 0;i<edges;i++){
        long long u;
        long long v;
        cin>>u>>v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    vector<bool> visited(vertices+1, false);
    vector<long long> ans;
    for(int i=1;i<=vertices;i++){
        if(visited[i]==false){
            bfs(i, adjList, visited, ans);
        }
    }
    for(auto e : ans){
        cout<<e<<' ';
    }
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