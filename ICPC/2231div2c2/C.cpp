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
long long getAns(long long root, vector<vector<long long>> adjList, long long &ans, vector<long long> &connections, vector<bool> &dams, vector<long long> &damamount)
{
    // extreme node
    if (adjList[root].size() == 0)
    {
        if (dams[root])
        {
            damamount[root] = 1;
            return 1;
        }
        else
        {
            return damamount[root] = 0;
        
        }
    }
    long long totals = 0;
    for (auto child : adjList[root])
    {
        
        damamount[child] =  getAns(child, adjList, ans, connections, dams, damamount);
        totals += damamount[child];
    }
    if (totals == 0)
    {
        return 0 + (int)(dams[root]);
    }
    else if (totals == 1)
    {
        if (dams[root])
        {
            ans++;
            connections.push_back(adjList[root].back());
            return 1;
        }
        return 1;
    }
    else
    {
        if (dams[root])
        {
            ans += totals;
            for (auto child : adjList[root])
            {
                if (damamount[child])
                {   
                    connections.push_back(child);
                }
            }
            return totals + 1;      
        }
        else{
            ans += (totals-1);
            for (auto child : adjList[root])
            {
                if (damamount[child])
                {
                    connections.push_back(child);
                }
            }
            connections.pop_back();
 
        }
    }
    return 0;
}
void solve()
{
    long long n;
    cin >> n;
    vector<vector<long long>> adjList(n + 1);
    for (int i = 0; i < n - 1; i++)
    {
        long long parent;
        cin >> parent;
        long long child = i + 2;
        adjList[parent].push_back(child);
    }
    long long m; // number of vertices containing beaver dams
    cin >> m;
    vector<bool> verticedams(n + 1, false);
    for (int i = 0; i < m; i++)
    {
        long long vertice;
        cin >> vertice;
        verticedams[vertice] = true;
    }
    if (verticedams.size() == 1)
    {
        cout << 0 << '\n';
    }
    else
    {
        long long ans = 0;
        vector<long long> connections;
        vector<long long> damAmount(n+1);
        getAns(1, adjList, ans, connections, verticedams, damAmount);
        cout << ans << ' ';
        for (auto i : connections)
        {
            cout << i << ' ';
        }
        cout << '\n';
    }
}

int main()
{
    fast_io;
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
    return 0;
}