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
    long long d;
    cin >> n >> d;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
    }
    sort(arr.begin(), arr.end());
    
    if (n % 2 == 0)
    {
        for (int i = 0; i < n; i = i + 2)
        {
            if (arr[i + 1] - arr[i] > d)
            {
                cout << "NO" << '\n';
                return;
            }
        }
        cout << "YES" << '\n';
    }
    else
    {
        for (int i = 0; i < n; i++)
        {
            bool gotans = true;
            vector<long long> newarr(n - 1);
            long long mainIndex = 0;
            
            for (int j = 0; j < n; j++)
            {
                if (j == i)
                    continue;
                newarr[mainIndex++] = arr[j];
            }
            
            for (int j = 0; j < n - 1; j = j + 2)
            {
                if (newarr[j + 1] - newarr[j] > d)
                {
                    gotans = false;
                    break;
                }
            }
            
            if (gotans)
            {
                cout << "YES" << '\n';
                return; // Exits successfully if a solution is found
            }
        }
        
        // FIX: If the loop finishes and we never returned YES, we must print NO
        cout << "NO" << '\n'; 
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