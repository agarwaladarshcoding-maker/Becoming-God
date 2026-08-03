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
    long long n;
    cin>>n;
    vector<long long> strength(n);
    for(int i= 0;i<n;i++){
        cin>>strength[i];      
    }
    sort(strength.begin(), strength.end());
    long long minDiff = INT_MAX;
    for(int i = 1;i<n;i++){
        minDiff = min(minDiff, abs(strength[i]- strength[i-1]));
    }
    cout<<minDiff<<'\n';

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