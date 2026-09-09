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
const long long MOD = 1e9+7;
void solve() {
    long long n;
    long long m;
    cin>>n>>m;
    vector<vector<pair<long long, long long>>> adjList(n+1);
    for(int i =0;i<m;i++){
        long long u;
        long long v;
        long long w;
        cin>>u>>v>>w;
        adjList[u].push_back({v,w});
    }
    vector<long long> dist(n+1, INT_MAX);
    vector<long long > ways(n+1, 0);
    vector<long long> minFlights(n+1, INT_MAX);
    vector<long long> maxFlights (n+1, 0);
    priority_queue<pair<long long, long long>, vector<pair<long long, long long>>, greater<pair<long long, long long>>()> pq;
    pq.push({0,1});
    while(pq.empty()==false){
        long long d = pq.top().first;
        long long parent = pq.top().second;
        pq.pop();
        if(d> dist[parent]){
            continue;
        }
        for(auto edges: adjList[parent]){
            if(dist[edges.first]> dist[parent] + edges.second){
                dist[edges.first] = d + edges.second;
                pq.push({dist[edges.first], edges.first});
                ways[edges.first]++;
                minFlights[edges.first] = minFlights[parent] + 1;
                maxFlights[edges.first] = maxFlights[parent] + 1;
            }
            else if(dist[edges.first]==dist[parent]+ edges.second){
                ways[edges.first] = (ways[edges.first] + ways[parent])%MOD;
                minFlights[edges.first] =min(minFlights[edges.first], minFlights[parent] + 1);
                maxFlights[edges.first] = max(maxFlights[edges.first], maxFlights[parent] + 1);
            }
        }

    }
    cout<<dist[n]<<' '<<ways[n]<<minFlights[n]<<' '<<maxFlights[n]<<'\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}