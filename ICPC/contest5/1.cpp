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
    long long m;
    cin >> n >> m;
    vector<long long> arr(n);
    vector<long long> freq(m + 1, 0);
    long long ans = 0;
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
        freq[arr[i]]++;
    }
    long long elementLeft = n;
    for (int i = 1; i <= m; i++)
    {
        long long currentCount = elementLeft;
        long long selfCount = freq[i];
        currentCount -= selfCount;
        long long doubleCount = 0;
        if (i * 2 <= m)
        {
            doubleCount = 2 * (freq[i * 2]);
            currentCount -= freq[i * 2];
        }
        long long total = selfCount + doubleCount + currentCount;
        ans = max(ans, total);
        // cout << selfCount << ' ' << doubleCount << ' ' << currentCount << " " << ans << '\n';
        elementLeft -= selfCount;
    }
    cout << ans << '\n';
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