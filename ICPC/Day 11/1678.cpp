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
bool dfs(int i , vector<long long>&parent, vector<bool> &visited, vector<vector<long long>>&adjList,int &start){
    visited[i] = true;
    for(auto nbr : adjList[i]){
        if(visited[nbr]==false){
            parent[nbr] =i;
            dfs(nbr, parent, visited, adjList, start);
        }
        else{
            if(parent[i]!=nbr){
                start = i;
            }
        }
    }
}
void solve() {
    long long n;
    long long m;
    cin>>n>>m;
    vector<vector<long long>> adjList(n+1);
    for(int i =0;i<m;i++){
        long long u; 
        long long v;
        cin>>u>>v;
        adjList[u].push_back(v);
    }
    vector<long long> parent(n+1, -1);
    vector<bool> visited(n+1, false);
    int start = -1;
    for(int i= 1;i<=n;i++ ){
        if(visited[i]==false){
            dfs(i, parent, visited, adjList,start  );
        }
    }
    if(start==-1){
        cout<<"IMPOSSIBLE"<<'\n';
    }
    else{
        vector<long long> ans;
        long long beg = start;
        while(parent[start]!=beg){
            ans.push_back(start);
            start = parent[start];
        }
        if(ans.size()==2)
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