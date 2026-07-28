#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

const int MOD = 1e9 + 7;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, x;
    cin >> n >> x;

    vector<int> coins(n);
    for (int i = 0; i < n; i++) {
        cin >> coins[i];
    }
    
    // Sorting helps conceptually group smaller coins first, 
    // though the DP math works regardless of the input order.
    sort(coins.begin(), coins.end());

    // Create a 2D DP table: (n + 1) rows and (x + 1) columns
    // Initialize with 0s.
    vector<vector<int>> dp(n + 1, vector<int>(x + 1, 0));

    // Base Case: 1 way to make sum 0 for any subset of coins
    for (int i = 0; i <= n; i++) {
        dp[i][0] = 1;
    }

    // Iterate through coins (1 to n)
    for (int i = 1; i <= n; i++) {
        int current_coin = coins[i - 1]; // 0-indexed in the vector
        
        // Iterate through all possible sums (1 to x)
        for (int weight = 1; weight <= x; weight++) {
            
            // 1. Ways to make the sum WITHOUT this coin
            dp[i][weight] = dp[i - 1][weight];
            
            // 2. Ways to make the sum WITH this coin (if it fits)
            if (weight >= current_coin) {
                dp[i][weight] = (dp[i][weight] + dp[i][weight - current_coin]) % MOD;
            }
        }
    }

    cout << dp[n][x] << "\n";

    return 0;
}