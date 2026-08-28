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
    cin >> n;
    vector<long long> diff(n + 2, 0);
    
    int q;
    cin >> q;
    for(int i = 0; i < q; i++){
        int l, r;
        long long val; // Upgraded to prevent accumulation overflow
        cin >> l >> r >> val;
        
        // Corrected difference array logic for range addition
        diff[l] += val;
        diff[r + 1] -= val;
    }
    
    vector<long long> ans(n + 1, 0);
    for(int i = 1; i <= n; i++){
        ans[i] = ans[i - 1] + diff[i];
        cout << ans[i] << ' ';
    }
    cout << '\n'; // Flushes the line before the next test case starts
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