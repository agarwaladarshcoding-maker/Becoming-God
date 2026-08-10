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
    int n;
    cin >> n;
    vector<int> coins(n);
    int totalCoins = 0;
    for (int i = 0; i < n; i++) {
        cin >> coins[i];
        totalCoins += coins[i];
    }

    vector<bool> dp(totalCoins + 1, false);
    dp[0] = true;
    for (int coin : coins) {
        for (int sum = totalCoins; sum >= coin; sum--) {
            if (dp[sum - coin]) {
                dp[sum] = true;
            }
        }
    }

    vector<int> sums;
    for (int sum = 1; sum <= totalCoins; sum++) {
        if (dp[sum]) {
            sums.push_back(sum);
        }
    }

    cout << sums.size() << '\n';
    for (int i = 0; i < (int)sums.size(); i++) {
        cout << sums[i] << (i + 1 < (int)sums.size() ? ' ' : '\n');
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}