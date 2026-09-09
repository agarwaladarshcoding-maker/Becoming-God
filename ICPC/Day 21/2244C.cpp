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

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n;
    long long m;
    cin>>n>>m;
    vector<long long> arr(n);
    vector<long long> prefixSum(n+1,0);
    for(int i = 0;i<n;i++){
        cin>>arr[i];
        prefixSum[i+1] = prefixSum[i] + arr[i];
    }
    // vector<long long> posts(m);
    long long ans = prefixSum[n];
    for(int i = 0;i<m;i++){
        long long x;
        cin>>x;
        long long total = -prefixSum[x] + (prefixSum[n]- prefixSum[x]);
        // cout<<total<<'\n';
        ans = max(ans, total);

    }
    cout<<ans<<'\n';


}

int main() {
    fast_io;
    int t;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}