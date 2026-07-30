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
void bfs(int i, vector<long long> &parent, vector<bool> &visited, vector<vector<long long>>&adjList){
    queue<long long> q;
    q.push(i);
    visited[i] = true;
    while(!q.empty()){
        long long parental = q.front();
        q.pop();
        for(auto nbr: adjList[parental]){
            if(visited[nbr]==false){
                visited[nbr] = true;
                parent[nbr] = parental;
                q.push(nbr);
            }
        }
    }
}
void solve() {
    long long vertices;
    long long edges;
    cin>>vertices>>edges;
    vector<vector<long long>> adjList(vertices+1);
    for(int i =0;i<edges;i++){
        long long x;
        long long y;
        cin>>x>>y;
        adjList[x].push_back(y);
        adjList[y].push_back(x);
    }
    vector<long long> parent(vertices+1, -1);
    vector<bool> visited(vertices+1, false);
    for(int i =1;i<vertices;i++){
        if(visited[i]==false){
            bfs(i, parent, visited, adjList);
        }
    }
    long long routeTo = vertices;
    vector<long long> path;
    while(parent[routeTo]!=-1){
        path.push_back(routeTo);
        routeTo = parent[routeTo];
    }
    if(routeTo!=1){
        cout<<"IMPOSSIBLE"<<'\n';
        return ;
    }
    path.push_back(1);
    reverse(path.begin(), path.end());
    cout<<path.size()<<'\n';
    for(auto i:path){
        cout<<i<<' ';
    }
    
}

int main() {
    fast_io;
    solve();
    return 0;
}