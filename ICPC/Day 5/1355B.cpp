#include <iostream>
#include <vector>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n;
    cin >> n;
    
    // We can read directly into the frequency array to save some space and time
    vector<long long> freq(n + 1, 0);
    for (int i = 0; i < n; i++) {
        long long inexp;
        cin >> inexp;
        freq[inexp]++;
    }
    
    long long ans = 0;
    long long carryOver = 0;
    
    for (int i = 1; i <= n; i++) {
        // Combine the unused explorers from previous steps with the current ones
        long long total_available = freq[i] + carryOver;
        
        // Form as many groups of size 'i' as possible
        ans += total_available / i;
        
        // The remainder carries over to the next requirement level
        carryOver = total_available % i;
    }
    
    cout << ans << '\n';
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