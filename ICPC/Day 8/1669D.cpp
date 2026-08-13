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
    string s;
    cin >> s;
    long long countReds = 0;
    long long countBlues = 0;
    int i = 0;
    while (i < n)
    {
        char ch = s[i];
        if (ch == 'R')
        {
            countReds++;
        }
        else if (ch == 'B')
        {
            countBlues++;
        }
        else
        {
            if ((countReds == 0 || countBlues == 0))
            {

                if (countReds != countBlues)
                {
                    cout << "NO" << '\n';
                    return;
                }
            }
            countBlues = countReds = 0;
        }
        i++;
    }
     if ((countReds == 0 || countBlues == 0))
            {

                if (countReds != countBlues)
                {
                    cout << "NO" << '\n';
                    return;
                }
            }
    cout << "YES" << '\n';
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