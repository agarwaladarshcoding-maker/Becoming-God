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
const long long MOD = 1e9 + 7;
long long getAns(int index, string temp, string &s, int holding, vector<vector<long long>> &dp, map<string, bool> &dict)
{
    if (index == s.length())
    {
        if (dict[temp])
        {
            return 1;
        }
        return 0;
    }
    if (dp[index][holding] != -1)
    {
        return dp[index][holding];
    }
    // two sceiarois continue with that string
}
void solve()
{
    string s;
    cin >> s;
    long long dicsize;
    cin >> dicsize;
    map<string, bool> dictionary;
    for (int i = 0; i < dicsize; i++)
    {
        string temp;
        cin >> temp;
        dictionary[temp] = true;
    }
    int l = s.length();
    vector<vector<long long>> dp(l, vector<long long>(2, -1));
    getAns(0, "", s, 0, dp, dictionary);
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