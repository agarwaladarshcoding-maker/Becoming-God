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

void solve()
{
    long long n;
    long long k;
    cin >> n >> k;
    vector<vector<long long>> adjList(n + 1);
    for (int i = 0; i < n - 1; i++)
    {
        long long u;
        long long v;
        cin >> u >> v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    vector<long long> dist(n + 1, INT_MAX);
    dist[1] = dist[0] =  0;
    priority_queue<pair<long long, long long>, vector<pair<long long, long long>>, greater<pair<long long, long long>>> pq;
    pq.push({0, 1});
    while (pq.empty() == false)
    {
        auto temp = pq.top();
        pq.pop();
        long long alreadyTravelled = temp.first;
        long long node = temp.second;
        for (auto nbr : adjList[node])
        {
            if (dist[nbr] > dist[node] + 1)
            {
                dist[nbr] = dist[node] + 1;
                pq.push({dist[nbr], nbr});
            }
        }
    }
    
    sort(dist.begin(), dist.end());
    for (int i = 1; i <= n; i++)
    {
        cout << dist[i] << ' ';
    }
    cout<<'\n';
    long long ans = 0;
    int i = n;
    while(k>0){
        ans = ans + dist[i];
        i--;
        k--;
    }
    cout<<ans<<'\n';
}

int main()
{
    fast_io;
    solve();
    return 0;
}