#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
const int LOG  = 17;   // 2^17 > 100000, enough for MAXN

int sparse[MAXN][LOG];
int arr[MAXN];
int logTable[MAXN];

// Precompute log2 values for O(1) lookup during queries
void buildLogTable(int n) {
    logTable[1] = 0;
    for (int i = 2; i <= n; i++)
        logTable[i] = logTable[i / 2] + 1;
}

// Build the sparse table
void buildSparseTable(int n) {
    // Base case: ranges of length 1 (2^0)
    for (int i = 0; i < n; i++)
        sparse[i][0] = arr[i];

    // Fill in increasing order of range length (2^j)
    for (int j = 1; (1 << j) <= n; j++) {
        for (int i = 0; i + (1 << j) - 1 < n; i++) {
            sparse[i][j] = min(sparse[i][j - 1],
                                sparse[i + (1 << (j - 1))][j - 1]);
        }
    }
}

// Answer a range minimum query [L, R] in O(1)
int query(int L, int R) {
    int len = R - L + 1;
    int k = logTable[len];          // largest k with 2^k <= len
    return min(sparse[L][k], sparse[R - (1 << k) + 1][k]);
}

int main() {
    int n;
    cin >> n;
    for (int i = 0; i < n; i++)
        cin >> arr[i];

    buildLogTable(n);
    buildSparseTable(n);

    int q;
    cin >> q;
    while (q--) {
        int L, R;
        cin >> L >> R;              // 0-indexed, inclusive
        cout << query(L, R) << "\n";
    }
    return 0;
}