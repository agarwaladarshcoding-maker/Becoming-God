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
void prefixFunc(string s, int n, vector<long long> &pi)
{
    for (int i = 1; i < n; i++)
    {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j])
        {
            j = pi[j - 1];
        }
        if (s[i] == s[j])
        {
            j++;
            pi[i] = j;
        }
    }
}

void solve()
{
    string s;
    cin >> s;
    vector<long long> ans;
    int n = s.length();
    vector<long long> pi(n);
    prefixFunc(s, n, pi);
    long long firstLength = 0;
    for (int i = 0; i < n; i++)
    {
        if (pi[i] != 0)
        {
            firstLength = i;
            break;
        }
    }
    ans.push_back(firstLength);
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