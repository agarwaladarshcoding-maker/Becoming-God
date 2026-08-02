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

void bfs(long long i,vector<vector<long long>> &adjList,vector<long long>&colors, vector<bool>&visited ){
    queue<long long> q;
    q.push(i);
    colors[i] = 0;
    while(!q.empty()){
        long long parent = q.front();
        long long oppColor = 1-colors[parent];
        q.pop();
        visited[parent] = true;
        for(auto nbr: adjList[parent]){
            if(visited[nbr]==false){
                colors[nbr] = oppColor;
                q.push(nbr);
            }
            else{
                if(colors[nbr]==colors[parent]){
                    cout<<"IMPOSSIBLE"<<'\n';
                    exit(0);
                }
            }
        }
    }
}

void solve() {
    long long vertices;
    long long edges;
    cin>>vertices>>edges;
    vector<vector<long long>> adjList(vertices+1);
    for(int i = 0;i<edges;i++){
        long long u; 
        long long v;
        cin>>u>>v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    vector<bool> visited(vertices+1, false);
    vector<long long> colors(vertices+1, -1);
    for(int i = 1;i<=vertices;i++){
        
        if(visited[i]==false){
            
            bfs(i, adjList, colors, visited);
        }
    } 
    for(int i = 1;i<=vertices;i++){
        cout<<colors[i]+1<<' ';
    }

}

int main() {
    fast_io;
    solve();
    return 0;
}