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
    vector<long long> b(n);
    long long totalSum = 0;
    long long nonZeroLength = 0;
    for(int i = 0;i<n;i++){
        cin>>b[i];
        totalSum += b[i];
        if(b[i]!=0) nonZeroLength++;
    }
    long long maxValue = totalSum - n + 1;
    long long ans = min(maxValue, nonZeroLength);
    cout<<ans<<'\n';

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