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
    long long n, m;
    cin >> n >> m; // Corrected input order: n vertices, m edges
    
    // Minimum isolated vertices
    long long mini = max(0LL, n - 2 * m);
    
    // Maximum isolated vertices
    long long k = 0;
    while (k * (k - 1) / 2 < m) {
        k++;
    }
    long long maxi = n - k;
    
    cout << mini << ' ' << maxi << '\n';
}

int main() {
    fast_io;
   solve();
}