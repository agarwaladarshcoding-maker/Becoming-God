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
    long long a;
    long long b;
    cin >> a >> b;
    if ((a + b) % 3 != 0)
    {
        cout << "NO" << '\n';
    }
    else
    {
        if (a == b)
        {
            cout << "YES" << '\n';
        }
        else if (a > b)
        {
            if (a <= 2 * b)
            {
                cout<<"YES"<<'\n';
            }
            else
            {
                cout << "NO" << '\n';
            }
        }
        else
        {
            if (b <= 2 * a)
            {
                   cout<<"YES"<<'\n';
            }
            else
            {
                cout << "NO" << '\n';
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