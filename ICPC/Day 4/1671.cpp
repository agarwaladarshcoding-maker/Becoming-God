#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <climits>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <cstdint>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long vertices;
    long long edges;
    cin>>vertices>>edges;
    vector<vector<pair<long long, long long>>> adjList(vertices+1);
    for(int i = 0;i<edges;i++){
        long long u;
        long long v;
        long long w;
        cin>>u>>v>>w;
        adjList[u].push_back({v,w});
    }
    //dijakstra
    // distance, vertice
    priority_queue<pair<long long , long long>, vector<pair<long long, long long>>, greater<pair<long long, long long>>> pq;
    vector<long long> dist(vertices+1, INT64_MAX);
    dist[1] = 0;
    pq.push({0,1});
  
    while(pq.empty()==false){
        auto temp = pq.top();
        long long d =temp.first;
        long long u = temp.second;
        pq.pop();
        if (d > dist[u]) continue;
        for(auto nbr : adjList[u] ){
            long long w = nbr.second;
            long long v = nbr.first;
            if(dist[v]>dist[u]+w ){
                dist[v] = dist[u] + w;
                pq.push({ dist[v], v});
            }
        }
    }
    for(int i= 1;i<=vertices;i++){
        cout<<dist[i]<<' ';
    }// 6, 2 // 2, 3
}

int main() {
    fast_io;
    solve();
    return 0;
}