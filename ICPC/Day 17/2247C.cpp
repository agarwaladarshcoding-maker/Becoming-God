#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)

void solve() {
    long long n;
    cin >> n;
    vector<long long> a(n), b(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = 0; i < n; i++) cin >> b[i];

    // Precompute prefix sum of original array 'a'
    vector<long long> prefixSum(n + 1, 0);
    for (int i = 0; i < n; i++) {
        prefixSum[i + 1] = prefixSum[i] + a[i];
    }

    long long tweakCount = 0;
    long long ans = 0; 
    
    // Process from right to left
    for (int i = n - 1; i >= 0; i--) {
        // Calculate the current value of a[i] based on how many times we've flipped
        long long current_a = (tweakCount % 2 == 0) ? a[i] : (1 - a[i]);
        
        // If they don't match, we MUST flip the prefix up to i
        if (current_a != b[i]) {
            long long ones = prefixSum[i + 1];
            long long zeros = (i + 1) - ones;
            
            // Swap ones and zeros if we have inverted an odd number of times
            if (tweakCount % 2 != 0) {
                swap(ones, zeros);
            }

            // CONDITION: Prefix can only be flipped if 1s and 0s are equal
            if (ones == zeros) {
                tweakCount++;
                ans++;
            } else {
                // If we need to flip but the condition isn't met, it's impossible
                cout << -1 << '\n';
                return;
            }
        }
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