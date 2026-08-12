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
    long long nodes;
    long long edges;
    cin>>nodes>>edges;
    vector<vector<pair<long long, long long>>> adjList(nodes+1);
    for(int i = 0;i<edges;i++){
        long long u;
        long long v;
        long long w;
        cin>>u>>v>>w;
        adjList[u].push_back({v,w});
    }
    deque<pair<long long, long long>> dq;
    vector<long long> distArray(nodes+1, INT_MAX);
    distArray[1]= 0;
    dq.push_back({0,1});
    while(dq.empty()==false){
        auto temp = dq.front();
        dq.pop_front();
        long long distance = temp.first;
        long long parent = temp.second;
        for(auto nbr : adjList[parent]){
            long long v = nbr.first;
            long long w = nbr.second;
            if(distArray[v]>distArray[parent] + w ){
                distArray[v] = distArray[parent] +w;
                if(w==0){
                    dq.push_front({distArray[v], v});
                }
                else{
                    dq.push_back({distArray[v], v});
                }
            }
        }
    }
    for(int i = 1;i<=nodes;i++){
        cout<<distArray[i]<<' ';
    }
    cout<<'\n';
    

}

int main() {
    fast_io;
    solve();
    return 0;
}