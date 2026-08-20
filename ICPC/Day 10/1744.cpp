#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int a, b;
    if (!(cin >> a >> b)) return 0;

    // DP table initialized to a sufficiently large number
    vector<vector<int>> dp(a + 1, vector<int>(b + 1, 1e9));

    for (int w = 1; w <= a; ++w) {
        for (int h = 1; h <= b; ++h) {
            if (w == h) {
                // Base case: already a square
                dp[w][h] = 0;
            } else {
                // Try all vertical cuts
                for (int i = 1; i < w; ++i) {
                    dp[w][h] = min(dp[w][h], 1 + dp[i][h] + dp[w - i][h]);
                }
                // Try all horizontal cuts
                for (int j = 1; j < h; ++j) {
                    dp[w][h] = min(dp[w][h], 1 + dp[w][j] + dp[w][h - j]);
                }
            }
        }
    }

    cout << dp[a][b] << "\n";
    return 0;
}