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
    vector<long long> present(n + 1, false);
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
        present[arr[i]] = true;
    }
    vector<long long> leftOut;
    for (int i = 1; i <= n; i++)
    {
        if (present[i] == false) 
        {
            leftOut.push_back(i);
        }
    }
    for (int i = 0; i < n; i++)
    {
        if (arr[i] == 0)
        {
            arr[i] = leftOut.back();
            leftOut.pop_back();
        }
    }
    // for(int i = 0;i<n;i++){
    //     cout<<arr[i]<<' ';
    // }
    // cout<<'\n';
    pair<long long, long long> range = {n, -1};
    for(int i = 0;i<n;i++){
        if(arr[i]==i+1){
            continue;
        }
        else{
            range.first = min(range.first, (long long)i);
            range.second = max(range.second, (long long)i);
        }
    }
    if(range.first==n){
        cout<<0<<'\n';
        return ;
    }
    cout<<range.second - range.first +1<<'\n';
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