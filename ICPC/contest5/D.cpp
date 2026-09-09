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
bool isBlack(vector<pair<long long, long long>> &col1, vector<pair<long long, long long>> &col2, long long index, long long colType)
{
    if (colType == 0)
    {
        for (auto p : col1)
        {
            if (index >= p.first && index <= p.second)
            {
                return true;
            }
        }
    }
    else
    {
        for (auto p : col2)
        {
            if (index >= p.first && index <= p.second)
            {
                return true;
            }
        }
    }
    return false;
}
pair<long long, long long> biggestConBlock(vector<pair<long long, long long>> &col1, vector<pair<long long, long long>> &col2, long long low, long long high, long long colType)
{
    pair<long long, long long> ans = {0, 0};
    long long length = 0;
    if (colType == 0)
    {
        for (auto p : col1)
        {
            if (p.first >= low && p.second <= high)
            {
                long long temp = p.second - p.first + 1;
                if (temp > length)
                {
                    length = temp;
                    ans = p;
                }
            }
            else if (p.first >= low && p.second > high)
            {
                long long temp = high - p.first + 1;
                if (temp > length)
                {
                    length = temp;
                    ans = p;
                }
            }
            else if (p.first < low && p.second <= high)
            {
                long long temp = p.second - low + 1;
                if (temp > length)
                {
                    length = temp;
                    ans = p;
                }
            }
            else if (p.first < low && p.second > high)
            {
                return {low, high};
            }
            else
            {
                continue;
            }
        }
    }
    else
    {
        for (auto p : col2)
        {
            if (p.first >= low && p.second <= high)
            {
                long long temp = p.second - p.first + 1;
                if (temp > length)
                {
                    length = temp;
                    ans = p;
                }
            }
            else if (p.first >= low && p.second > high)
            {
                long long temp = high - p.first + 1;
                if (temp > length)
                {
                    length = temp;
                    ans = {p.first, high};
                }
            }
            else if (p.first < low && p.second <= high)
            {
                long long temp = p.second - low + 1;
                if (temp > length)
                {
                    length = temp;
                    ans = {low, p.second};
                }
            }
            else if (p.first < low && p.second > high)
            {
                return {low, high};
            }
            else
            {
                continue;
            }
        }
    }

    return ans;
}
void getAns(vector<pair<long long, long long>> &col1, vector<pair<long long, long long>> &col2, long long low, long long high, vector<long long> &ans)
{
    if (low > high)
    {
        return;
    }
    if (low == high)
    {
        if (isBlack(col1, col2, low, 1) || isBlack(col1, col2, low, 0))
        {
            ans.push_back(1);
        }
        return;
    }
    auto tempCol0 = biggestConBlock(col1, col2, low, high, 0);
    auto tempCol1 = biggestConBlock(col1, col2, low, high, 1);
    long long length0 = tempCol0.second - tempCol0.first + 1;
    long long length1 = tempCol1.second - tempCol1.first + 1;
    // cout<<length0<<' '<<length1<<'\n';
    if (length1 > length0)
    {
        ans.push_back(length1);
        getAns(col1, col2, low, tempCol1.first - 1, ans);
        getAns(col1, col2, tempCol1.second + 1, high, ans);
    }
    else
    {
        ans.push_back(length0);
        getAns(col1, col2, low, tempCol0.first - 1, ans);
        getAns(col1, col2, tempCol0.second + 1, high, ans);
    }
}
void solve()
{
    long long n;
    long long m;
    cin >> n >> m;
    vector<pair<long long, long long>> blacksCol1(n);
    vector<pair<long long, long long>> blacksCol2(m);
    long long lastIndex = 0;
    for (int i = 0; i < n; i++)
    {
        long long u;
        long long v;
        cin >> u >> v;
        blacksCol1[i] = {u, v};
        lastIndex = max(lastIndex, v);
    }
    for (int i = 0; i < m; i++)
    {
        long long u;
        long long v;
        cin >> u >> v;
        blacksCol2[i] = {u, v};
        lastIndex = max(lastIndex, v);
    }
    // cout<<lastIndex<<'\n';
    // cout<<isBlack(blacksCol1, blacksCol2, 2, 1)<<'\n';
    // cout<<isBlack(blacksCol1, blacksCol2, 2, 0)<<'\n';
    vector<long long> ans;
    getAns(blacksCol1, blacksCol2, 0, lastIndex, ans);

    sort(ans.begin(), ans.end());
    reverse(ans.begin(), ans.end());
    cout << ans.size() << '\n';
    for (auto i : ans)
    {
        cout << i << ' ';
    }
    cout << '\n';
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