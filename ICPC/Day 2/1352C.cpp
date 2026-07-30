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
    long long k;
    cin>>n>>k;
    long long gaps = n-1;
    long long startpointmulti = k/gaps;
    long long left = k%gaps;
    if(left==0) left=-1;
    long long ans = n*startpointmulti + left;
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