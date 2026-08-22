#include <iostream>
#include <vector>

using namespace std;

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)

void solve() {
    int n;
    cin >> n;
    
    vector<int> l(n), r(n), u(n), v(n);
    for (int i = 0; i < n; i++) {
        cin >> l[i] >> r[i] >> u[i] >> v[i];
    }

    // Check every possible total length 'm' from highest (n) to lowest (1)
    for (int m = n; m >= 1; m--) {
        int curr_i = 0; // Pointer for the elements in our array
        bool possible = true;

        // Try to greedily fill ranks j from 1 to m
        for (int j = 1; j <= m; j++) {
            bool found_element_for_j = false;
            
            // Look for the earliest element that is allowed to be at rank j
            while (curr_i < n) {
                // Check if current element curr_i can take left rank 'j'
                bool left_valid = (j < l[curr_i] || j > r[curr_i]);
                
                // Check if current element curr_i can take right rank 'm - j + 1'
                int right_rank = m - j + 1;
                bool right_valid = (right_rank < u[curr_i] || right_rank > v[curr_i]);
                
                if (left_valid && right_valid) {
                    found_element_for_j = true;
                    curr_i++; // Element used! Move past it for the next rank
                    break;    // Successfully filled rank j, move to j+1
                }
                
                curr_i++; // Element wasn't valid for rank j, check the next one
            }

            // If we ran out of array elements before filling rank j, this 'm' fails
            if (!found_element_for_j) {
                possible = false;
                break; 
            }
        }

        // If we successfully filled all ranks 1 to m, this is our maximum length
        if (possible) {
            cout << m << "\n";
            return;
        }
    }

    // If the loop finishes without returning, not even a length 1 subsequence is valid
    cout << 0 << "\n";
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