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

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)
void dfs(long long root, long long parent, vector<bool> &hasCat, vector<long long> &hasMany, vector<vector<long long>> &adjList, long long &ans, long long m, vector<long long> & maxonRoad)
{
    if (adjList[root].size() == 0)
    {
        long long back = hasMany[parent];

        if (hasCat[root])
        {
            back++;
        }
        maxonRoad[root] = max(maxonRoad[root],back );
        if (back <= m &&maxonRoad[root]<=m)
        {
            ans++;
        }
        return ;
    }
    if (hasCat[root])
    {
        if (parent == -1)
        {
            hasMany[root] = 1;
        }
        else
        {
            hasMany[root] = hasMany[parent] + 1;
        }
        maxonRoad[root] = max(maxonRoad[parent], hasMany[root]);
    }
    else
    {
        maxonRoad[root] = max(maxonRoad[parent], hasMany[parent]);
        hasMany[root] = 0;
    }
    for (auto edge : adjList[root])
    {
        dfs(edge, root, hasCat, hasMany, adjList, ans, m, maxonRoad);
    }
}
void solve()
{
    long long n;
    long long m;
    cin >> n >> m;
    vector<bool> hasCat(n + 1, false);
    for (int i = 0; i < n; i++)
    {
        long long x;
        cin >> x;
        hasCat[i + 1] = x;
    }
    vector<vector<long long>> adjList(n + 1);
    for (int i = 0; i < n-1; i++)
    {
        long long u;
        long long v;
        cin >> u >> v;
        adjList[u].push_back(v);
    }
    vector<long long> howMany(n + 1, 0);
    vector<long long> maxOnRoad(n+1, 0);
    long long ans = 0;
    dfs(1, -1, hasCat, howMany, adjList, ans, m, maxOnRoad);
    cout << ans << '\n';
}

int main()
{
    fast_io;
    solve();
    return 0;
}