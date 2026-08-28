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
const long long MOD = 998244353;
void solve() {
    long long n;
    cin>>n;
    vector<long long > a(n);
    vector<long long> b(n);
    for(int i = 0;i<n;i++){
        cin>>a[i];
    }
    for(int i = 0;i<n;i++){
        cin>>b[i];
    }
    vector<vector<long long>> dp(n, vector<long long>(2));
    dp[0][1] = dp[0][0] = 1;
    for(int i = 1;i<n;i++){
        if(a[i-1]<=a[i]&&b[i-1]<=b[i]){
            dp[i][0] = (dp[i][0] + dp[i-1][0])%MOD;
        }
        if(b[i-1]<=a[i]&&a[i-1]<=b[i]){
            dp[i][0] = (dp[i][0] + dp[i-1][0])%MOD;
        }
        if(a[i-1]<=b[i]&&b[i-1]<=a[i]){
            dp[i][1] = (dp[i][1] + dp[i-1][0])%MOD;
        }
        if(a[i-1]<=a[i]&&b[i-1]&&b[i-1]<=b[i]){
            dp[i][1] = (dp[i][1]+ dp[i-1][1])%MOD;
        }
    }
    cout<<((dp[n-1][1]+ dp[n-1][0])%MOD)<<'\n';
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