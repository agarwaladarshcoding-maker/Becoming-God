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
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
    }
    unordered_map<long long, long long> alreadysums;
    long long count = 0;
    long long runningSum = 0;
    long long mini = 0;
    for (int i = 0; i < n; i++)
    {
        runningSum += arr[i];
        alreadysums[runningSum]++;
        mini = min(mini, runningSum);
        long long checkingAmount = runningSum;
        while (checkingAmount >= mini)
        {
            if (alreadysums.count(checkingAmount))
            {
                cout << alreadysums[checkingAmount];
                count += alreadysums[checkingAmount];
            }
            checkingAmount -= n;
        }
    }
    cout << count << '\n';
}

int main()
{
    fast_io;
    solve();
    return 0;
}