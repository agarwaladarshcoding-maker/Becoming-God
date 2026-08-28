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

#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void solve() {
    int n;
    cin >> n;
    
    vector<int> a(n), b(n);
    int sum_a = 0, sum_b = 0;
    
    // Read arrays and calculate their XOR sums
    for(int i = 0; i < n; i++) {
        cin >> a[i];
        sum_a ^= a[i];
    }
    for(int i = 0; i < n; i++) {
        cin >> b[i];
        sum_b ^= b[i];
    }
    
    // Build the puzzle pieces (Invariant array C + the hidden element S)
    vector<int> C_A, C_B;
    
    for(int i = 0; i < n; i++) {
        C_A.push_back(a[i] ^ sum_a);
        C_B.push_back(b[i] ^ sum_b);
    }
    C_A.push_back(sum_a); // Add the spare piece
    C_B.push_back(sum_b); // Add the spare piece
    
    // If they are exactly the same set of pieces, it's possible!
    sort(C_A.begin(), C_A.end());
    sort(C_B.begin(), C_B.end());
    
    if (C_A == C_B) {
        cout << "YES\n";
    } else {
        cout << "NO\n";
    }
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