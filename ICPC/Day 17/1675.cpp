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
    vector<long long> l(n);
    vector<long long> r(n);
    vector<long long> u(n);
    vector<long long> v(n);
    for (int i = 0; i < n; i++)
    {
        cin >> l[i] >> r[i] >> u[i] >> v[i];
    }
    for (int i = n; i >= 0; i--)
    {
        if (i == 0)
        {
            cout << 0 << '\n';
            return;
        }
        else
        {
            long long targetSize = i;
            long long index = 1;
            long long currentSize = 0;
            for (int j = 0; j < n; j++)
            {
                long long leftRank = index;
                long long rightRank = targetSize - index + 1;
                if (((leftRank < l[j]) || (leftRank > r[j])) && ((rightRank < u[j]) || (rightRank > v[j])))
                {
                    currentSize++;
                    index++;
                }
            }
            if (currentSize == targetSize)
            {
                cout << targetSize << '\n';
                return;
            }
        }
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