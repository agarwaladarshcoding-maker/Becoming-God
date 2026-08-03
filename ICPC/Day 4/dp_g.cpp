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
    long long n;
    long long m;
    cin>>n>>m;
    vector<vector<long long>> adjList(n+1);
    for(int i =0;i<m;i++){
        long long x;
        long long y;
        cin>>x>>y;
        adjList[x].push_back(y);
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