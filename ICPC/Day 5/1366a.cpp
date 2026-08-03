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
    long long stick;
    long long diamond;
    cin>>stick>>diamond;
    long long ogS = stick;
    long long ogD = diamond;
    long long total = 0;
    long long greater = max(stick , diamond);
    long long smaller = min(stick, diamond);
    while(greater>=smaller){
        
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