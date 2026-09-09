This is quite a file, so right now what I want you to do is very simple thing I want you to create several different files. So first file would be about how the first file would contain only second episode second#include <iostream>
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
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
    }
    bool isSorted = true;
    for (int i = 0; i < n - 1; i++)
    {
        if (arr[i] > arr[i + 1])
        {
            isSorted = false;
            break;
        }
    }
    if (isSorted)
    {
        cout << -1 << '\n';
    }
    else
    {
        vector<long long> b(n);
        for (int i = 0; i < n; i++)
        {
            b[i] = arr[i];
        }
        sort(arr.begin(), arr.end());
        long long maxGap = 0;
        long long size = arr.size();
        maxGap = max(maxGap, abs(arr[0] - arr[1]));
        maxGap = max(maxGap, abs(arr[size - 1] - arr[size - 2]));
        for (int i = 1; i < size - 1; i++)
        {
            long long leftGap = abs(arr[i] - arr[i - 1]);
            long long rightGap = abs(arr[i] - arr[i + 1]);
            long long mini = max(rightGap, leftGap);
            maxGap = max(maxGap, mini);
        }
        cout<<maxGap<<'\n';
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