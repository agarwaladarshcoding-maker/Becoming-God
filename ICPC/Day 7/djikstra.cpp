#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>
typedef long long ll;
using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    ll nodes;
    ll edges;
    cin>>nodes>>edges;
    vector<vector<pair<ll, ll>>> adjList(nodes+1);
    for(int i= 0;i<edges;i++){
        ll u, v;
        ll w;
        cin>>u>>v>>w;
        adjList[u].push_back({v,w});
        adjList[v].push_back({u,w});
    }
    vector<long long> distanceArray(nodes +1, INT32_MAX);
    distanceArray[1] = 0;
    priority_queue<pair<long long, long long>, vector<pair<long long, long long>>, greater<pair<long long, long long>>> pq;
    pq.push({0,1});
    while(pq.empty()==false){
        auto temp =  pq.top();
        pq.pop();
        long long distance = temp.first;
        long long node = temp.second;
        for(auto nbr : adjList[node]){
            long long u = node;
            long long v = nbr.first;
            long long w = nbr.second;
            if(distanceArray[v]> distance + w){
                distanceArray[v] = distance + w;
                pq.push({distanceArray[v], v});
            }
        }
    }

    for(int i = 1;i<=nodes;i++){
        cout<<distanceArray[i]<<' ';
    }
    cout<<'\n';




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