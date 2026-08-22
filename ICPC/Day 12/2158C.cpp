#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n, k;
    cin >> n >> k;

    vector<long long> a(n), b(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = 0; i < n; i++) cin >> b[i];

    // If k is even, we use standard Kadane's Algorithm
    if (k % 2 == 0) {
        long long cur = a[0];
        long long best = a[0];
        for (int i = 1; i < n; i++) {
            cur = max(a[i], cur + a[i]);
            best = max(best, cur);
        }
        cout << best << '\n';
        return;
    }

    // dp0 = best subarray sum ending here without using b
    // dp1 = best subarray sum ending here after using b exactly once
    long long dp0 = a[0];
    long long dp1 = a[0] + b[0];
    long long best0 = a[0];
    long long best1 = a[0] + b[0];

    for (int i = 1; i < n; i++) {
        long long new0 = max(a[i], dp0 + a[i]);
        
        // Corrected transition for dp1
        long long new1 = max({
            a[i] + b[i],               // Option 1: Start new subarray using b here
            dp0 + a[i] + b[i],         // Option 2: Apply b on current element
            dp1 + a[i]                 // Option 3: b was already used, just add a[i]
        });

        dp0 = new0;
        dp1 = new1;

        best0 = max(best0, dp0);
        best1 = max(best1, dp1);
    }

    cout << max(best0, best1) << '\n';
}

int main() {
    fast_io;
    int t;
    if (cin >> t) {
        while (t--) {
            solve();
        }
    }
    return 0;
}