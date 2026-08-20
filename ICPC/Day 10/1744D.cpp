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
    cin >> n;
    vector<long long> arr(n);
    long long presence = 0;

    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
        long long element = arr[i];
        while (element % 2 == 0)
        {
            element = element / 2;
            presence++;
        }
    }

    vector<long long> gains;
    for (int i = 1; i <= n; i++)
    {
        int index = i;
        long long count = 0;
        while (index % 2 == 0)
        {
            index /= 2;
            count++;
        }

        if (count > 0)
        {
            gains.push_back(count);
        }
    }

    sort(gains.rbegin(), gains.rend());

    long long ans = 0;
    for (long long gain : gains)
    {
        if (presence >= n)
        {
            break;
        }

        presence += gain;
        ans++;
    }

    cout << (presence >= n ? ans : -1) << '\n';
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
