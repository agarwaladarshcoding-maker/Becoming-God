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
int lengthOfLIS(vector<long long>& nums) {
        vector<int> sub;
        
        for (int x : nums) {
        
            if (sub.empty() || sub.back() < x) {
                sub.push_back(x);
            } else {
                auto it = lower_bound(sub.begin(), sub.end(), x);
                *it = x;
            }
        }
        
        return sub.size();
    }
void solve() {
    long long n;
    cin>>n;
    vector<long long> arr(n);
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    cout<<lengthOfLIS(arr)<<'\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}