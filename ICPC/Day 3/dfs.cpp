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
void dfs(long long i,vector<vector<long long>>& adjList, vector<bool> &visited, vector<long long> &ans){
    visited[i] = true;
    ans.push_back(i);
    for(auto nbr: adjList[i]){
        if(visited[nbr]==false){
            dfs(nbr, adjList, visited, ans);
        }
    }

}
void solve() {
    long long vertices;
    long long edges;
    cin>>vertices>>edges;
    vector<vector<long long>> adjList(vertices+1);
    for(int i =0;i<edges;i++){
        long long u;
        long long v;
        cin>>u>>v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    vector<bool> visited(vertices+1, false);
    vector<long long> ans;
    for(int i = 1;i<=vertices;i++){
        if(visited[i]==false){
            dfs(i, adjList, visited, ans);
        }
    }
    for(auto i: ans){
        cout<<i<<' ';
    }

}

int main() {
    fast_io;
    solve();
    return 0;
}