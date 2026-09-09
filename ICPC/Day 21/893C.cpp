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
void dfs(long long i, vector<bool> &visited, long long &mini, vector<long long> &coins, vector<vector<long long>> &adjList)
{
    visited[i] = true;
    mini = min(mini, coins[i]);
    for (auto nbr : adjList[i])
    {
        if (visited[nbr] == false)
        {
            dfs(nbr, visited, mini, coins, adjList);
        }
    }
}
void solve()
{
    long long n;
    long long m;
    cin >> n >> m;
    vector<long long> coins(n + 1);
    for (int i = 1; i <= n; i++)
    {
        cin >> coins[i];
    }
    vector<vector<long long>> adjList(n+1);
    for (int i = 0; i < m; i++)
    {
        long long u;
        long long v;
        cin >> u >> v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    vector<bool> visited(n + 1, false);
    long long ans = 0;
    for (int i = 1; i <= n; i++)
    {
        if (visited[i] == false)
        {
            long long mini = INT_MAX;
            dfs(i, visited, mini, coins, adjList);
            ans += mini;
        }
    }
    cout << ans << '\n';
}

int main()
{
    fast_io;
    solve();
    return 0;
}