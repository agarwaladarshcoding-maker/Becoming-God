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
long long findparent(vector<long long> &parent, long long u)
{
    if (u == parent[u])
    {
        return u;
    }
    return parent[u] = findparent(parent, parent[u]);
}
void solve()
{
    long long n;
    long long q;
    cin >> n >> q;
    vector<pair<long long, long long>> roads(q);
    for (int i = 0; i < q; i++)
    {
        long long u;
        long long v;
        cin >> u >> v;
        roads[i] = {u, v};
    }

    // number pf comp , max size
    pair<long long, long long> maxi = {n, 1};
    vector<long long> parents(n + 1);
    vector<long long> size(n + 1, 1);
    for (int i = 1; i <= n; i++)
    {
        parents[i] = i;
    }
    for (auto road : roads)
    {
        long long u = road.first, v = road.second;
        long long parentu = findparent(parents, u);
        long long parentv = findparent(parents, v);

        if (parentu == parentv)
            continue; // already same component — do nothing

        if (size[parentu] < size[parentv])
        {
            maxi.first--;
            parents[parentu] = parentv; // also: attach ROOT to ROOT, not u to v
            size[parentv] += size[parentu];
            maxi.second = max(maxi.second, size[parentv]);
        }

        else
        {
            maxi.first--;
            parents[parentv] = parentu;
            size[parentu] += size[parentv];
            maxi.second = max(maxi.second, size[parentu]);
        }
        cout<<maxi.first<<' '<<maxi.second<<'\n';
        
    }
    
}

int main()
{
    fast_io;
    solve();
    return 0;
}