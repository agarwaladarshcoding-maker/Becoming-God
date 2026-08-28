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
long long bipow(long long a, long long b, long long m){
    a = a %m;
    long long res = 1;
    while(b>0){
        if(b&1){
            res = res * a%m;
        }
        a= a*a%m;
        b>>=1;
    }
    return res;
}
void solve() {
    long long a, b, c;
    cin >> a >> b >> c;
    
    if (a == 0) {
        if (b == 0 && c > 0) {
            cout << 1 << '\n';
        } else {
            cout << 0 << '\n';
        }
    } else {
        // Use LL suffix to force integer literals, avoiding double precision loss
        long long ans = bipow(b, c, 1000000006LL);
        long long ans2 = bipow(a, ans, 1000000007LL);
        cout << ans2 << '\n';
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