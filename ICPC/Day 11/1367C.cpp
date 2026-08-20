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
    long long k;
    long long ans = 0;
    string s;
    cin >> n >> k;
    cin >> s;
    long long gapStart = 0;
    long long gapEnd = 0;
    int i = 0;
    while (i < n)
    {
        char ch = s[i];
        if (ch == '0')
        {
            gapStart = i;
            while (i < n && s[i] == ch)
            {
                i++;
            }
            gapEnd = i - 1;
            long long size = gapEnd - gapStart + 1;
            
            if(gapStart==0&&gapEnd==n-1){
                ans++;
                size--;
                while (size >= 2 * k + 1)
                {
                    ans++;
                    size = size - k - 1;
                }
                if (size >= k + 1)
                {
                    ans++;
                }
            }
            else if (gapStart == 0)
            {
                if (size >= k + 1)
                {
                    ans++;
                    size--;
                }
                while (size >= 2 * k + 1)
                {
                    ans++;
                    size = size - k - 1;
                }
            }
            else if (gapEnd == n-1)
            {
                while (size >= 2 * k + 1)
                {
                    ans++;
                    size = size - k - 1;
                }
                if (size >= k + 1)
                {
                    ans++;
                }
            }
            else
            {
                while (size >= 2 * k + 1)
                {
                    ans++;
                    size = size - k - 1;
                }
            }
        }
        else{
            i++;
        }
    }
    cout <<ans << '\n';
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