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
long long getAns(long long root, vector<vector<long long>>& adjList, long long dams, vector<bool>& damLocation, long long n, vector<long long>& ans) {
    long long total = 0;
    vector<long long> whohas;
    
    // 1. Post-order traversal to gather states from children
    for (auto nbr : adjList[root]) {
        long long hasornot = getAns(nbr, adjList, dams, damLocation, n, ans);
        if (hasornot) {
            total++;
            whohas.push_back(nbr);
        }
    }
    
    // 2. Greedy edge cutting based on current node's state
    if (damLocation[root]) {
        // We are a dam. Cut ALL children that have dams to prevent connection.
        for (long long child : whohas) {
            ans.push_back(child);
        }
        return 1; // Tell parent this component has a dam (us)
    } else {
        // We are NOT a dam. We can keep ONE child with a dam connected.
        if (total > 0) {
            // Cut all but one path
            for (int i = 0; i < total - 1; i++) {
                ans.push_back(whohas[i]);
            }
            return 1; // Tell parent this component has a dam (via the kept child)
        } else {
            return 0; // No dams in this entire component
        }
    }
}

void solve() {
    long long n;
    cin>>n;
    vector<vector<long long>> adjList(n+1);
    for(int i=1;i<=n-1;i++){
        long long parent ;
        cin>>parent;
        adjList[parent].push_back(i+1);
    }
    long long dams;
    cin>>dams;
    vector<bool> damLocation(n+1, false);
    for(int i=0;i<dams;i++){
        long long location;
        cin>>location;
        damLocation[location] = true;

    }
    vector<long long> ans ;

    getAns(1, adjList, dams, damLocation, n , ans);
    cout<<ans.size()<<' ';
    for(auto i: ans){
        cout<<i<<' ';
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