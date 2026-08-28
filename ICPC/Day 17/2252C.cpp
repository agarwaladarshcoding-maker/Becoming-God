#include <iostream>
#include <vector>
#include <map>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n;
    cin >> n;
    
    // The array length is 2*n according to the problem statement
    vector<long long> arr(2 * n);
    for (int i = 0; i < 2 * n; i++) {
        cin >> arr[i];
    }
    
    long long ans = 0;
    
    // Continue until the array is completely empty
    while (!arr.empty()) {
        map<long long, pair<int, int>> places;
        
        // Find the current first and last positions of every remaining element
        for (int i = 0; i < arr.size(); i++) {
            if (places.find(arr[i]) == places.end()) {
                places[arr[i]] = {i, i}; // First occurrence
            } else {
                places[arr[i]].second = i; // Second occurrence
            }
        }
        
        long long max_dist = -1;
        int best_l = -1, best_r = -1;
        
        // Find the element that gives the biggest distance (r - l + 1)
        for (auto const& [val, p] : places) {
            long long dist = p.second - p.first + 1;
            if (dist > max_dist) {
                max_dist = dist;
                best_l = p.first;
                best_r = p.second;
            }
        }
        
        // Add the squared distance to our answer
        ans += (max_dist * max_dist);
        
        // Erase the entire subarray [best_l, best_r].
        // This automatically removes fully contained elements, 
        // turns partially overlapping ones into singles, and shifts the rest.
        arr.erase(arr.begin() + best_l, arr.begin() + best_r + 1);
    }
    
    cout << ans << "\n";
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