#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include<bits/stdc++.h>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long vertices;
    long long edges;
    long long query;
    cin>>vertices>>edges>>query;
    vector<vector<pair<long long, long long>>> adjList(vertices+1);
    vector<vector<long long>> dp(vertices+1 , vector<long long>(vertices+1, INT64_MAX));
    for(int i= 0;i<edges;i++){
        long long u;
        long long v;
        long long w;
        cin>>u>>v>>w;
        adjList[u].push_back({v,w});
        adjList[v].push_back({u,w});
        dp[u][v] = min(dp[u][v], w);
        dp[v][u] = min(dp[v][u],w);
    }
    vector<pair<long long, long long>> queries(query);
    for(int i = 0;i<query;i++){
        long long x;
        long long y;
        cin>>x>>y;
        queries[i] = {x,y}; 
    }

    for(int i = 1;i<=vertices;i++){
        dp[i][i] = 0;
    }
    int n = vertices;
    for (int k = 1; k <= n; k++) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            if (dp[i][k] < INT64_MAX && dp[k][j] < INT64_MAX) {
                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j]);
            }
        }
    }
}
    for(auto q: queries){
        if(dp[q.first][q.second]==INT64_MAX)
        cout<<-1<<'\n';
        else
        cout<<dp[q.first][q.second]<<'\n';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}