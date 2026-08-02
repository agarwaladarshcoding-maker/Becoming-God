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
/*
 Problem: Woodcutters (CF 545C) -- count maximum trees that can be felled

 Approach:
 - First and last trees can always be felled (count = 2 for n>=2).
 - Maintain `lastOccupied`: the rightmost position occupied by a fallen/tree so far.
 - For each middle tree try:
     1) Fell left if its left tip is strictly to the right of `lastOccupied`.
     2) Otherwise try to fell right if its right tip is strictly left of next tree's position.
     3) Otherwise it stays upright.

 Example:
 Input:
 5
 1 2
 2 1
 5 10
 10 9
 12 1

 Output: 3

 Explanation: first falls left, third can fall left or right, last falls right -> total 3.
*/
void solve() {
    long long n;
    cin >> n;
    vector<pair<long long, long long>> trees(n);
    for (int i = 0; i < n; ++i) {
        long long pos, height;
        cin >> pos >> height;
        trees[i] = {pos, height};
    }

    if (n == 1) {
        cout << 1 << '\n';
        return;
    }
    if (n == 2) {
        cout << 2 << '\n';
        return;
    }

    long long ans = 2; // first and last
    long long lastOccupied = trees[0].first; // rightmost occupied position so far

    for (int i = 1; i < n - 1; ++i) {
        long long pos = trees[i].first;
        long long height = trees[i].second;

        // Try falling left: its left tip must be strictly greater than last occupied
        if (pos - height > lastOccupied) {
            ans++;
            lastOccupied = pos; // occupies up to its position when fallen left
        }
        // Try falling right: tip must be strictly before next tree
        else if (pos + height < trees[i + 1].first) {
            ans++;
            lastOccupied = pos + height; // occupies up to right tip
        }
        else {
            // stays standing
            lastOccupied = pos;
        }
    }

    cout << ans << '\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}