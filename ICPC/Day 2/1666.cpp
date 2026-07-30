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
void bfs(long long i, vector<bool> &visited, vector<vector<long long>> &adjList){
    queue<long long> q;
    q.push(i);
    visited[i] = true;
    while(!q.empty()){
        long long parent = q.front();
        q.pop();
        for(auto nbr : adjList[parent]){
            if(visited[nbr]==false){
                visited[nbr] = true;
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
    vector<bool> visited(vertices+1, false);
    vector<long long> connections;
    for(int i = 1;i<=vertices;i++){
        if(visited[i]==false)
        {
            connections.push_back(i);
            bfs(i, visited, adjList);
        }
    }
    cout<<connections.size()-1<<'\n';
    for(int i = 0;i<connections.size()-1;i++){
        cout<<connections[i]<<' '<<connections[i+1]<<'\n';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}