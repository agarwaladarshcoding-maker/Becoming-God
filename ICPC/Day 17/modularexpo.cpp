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
 
long long bipow(long long a, long long b , long long m){
    a = a%m;
    long long res = 1;
    while(b>0){
        if(b&1){
            res = res * a %m;
        }
        a = a*a%m;
        b>>=1;
    }
    return res;
}
void solve() {
    
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