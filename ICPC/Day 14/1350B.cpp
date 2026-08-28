#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n;
    cin >> n;
    vector<long long> arr(n);
    for(int i = 0; i < n; i++){
        cin >> arr[i];
    }
    
    vector<long long> dp(n + 1, 1); 
    
    for(int i = n; i >= 1; i--){
        for(int j = 2 * i; j <= n; j += i){
            if(arr[i - 1] < arr[j - 1]){
                dp[i] = max(dp[i], 1 + dp[j]);
            }
        }
    }
    

    cout << *max_element(dp.begin() + 1, dp.end()) << '\n';
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