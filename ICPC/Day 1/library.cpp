#include <iostream>
#include <vector>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m, q;
    cin >> n >> m >> q;

    // Use 1-based indexing, size (n+1) x (m+1), initialized to 0
    // Using long long because the sum of many 10^9 numbers will overflow a standard int
    vector<vector<long long>> arr(n + 1, vector<long long>(m + 1, 0));
    vector<vector<long long>> pref(n + 1, vector<long long>(m + 1, 0));

    // 1. Read input and build the prefix sum array
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            cin >> arr[i][j];
            
            // Build formula
            pref[i][j] = arr[i][j] 
                       + pref[i - 1][j] 
                       + pref[i][j - 1] 
                       - pref[i - 1][j - 1];
        }
    }

    // 2. Answer queries
    while (q--) {
        int r1, c1, r2, c2;
        cin >> r1 >> c1 >> r2 >> c2;

        // Query formula
        long long total_sum = pref[r2][c2] 
                            - pref[r1 - 1][c2] 
                            - pref[r2][c1 - 1] 
                            + pref[r1 - 1][c1 - 1];

        cout << total_sum << "\n";
    }

    return 0;
}