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

void solve() {
    long long vertices;
    long long edges;
    cin>>vertices>>edges;
    vector<vector<pair<long long , long long>>> adjList(vertices+1);
    for(int i =0;i<edges;i++){
        long long u;
        long long v;
        long long w;
        cin>>u>>v>>w;
        adjList[u].push_back({v,w});
    }
    vector<long long> dist(vertices+1, INT_MAX);
    dist[1] = 0;
    for(int i = 1;i<=vertices-1;i++){
        long long currentNode = i;
        for(auto nbr: adjList[currentNode]){
            if(dist[nbr.first]>dist[currentNode]+ nbr.second ){
                dist[nbr.first] = dist[currentNode] + nbr.second;
            }
        }
    }
    cout<<dist[vertices]<<'\n';

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