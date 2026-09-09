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
    long long a;
    long long b;
    cin>>a>>b;
    long long minOp = b- a;

    for(int i = 0;i<=minOp;i++){
        //case 1
        long long aNew = a+i;
        long long breq = aNew|b;
        long long op1 = i + (breq-b) +1;

        //case 2
        long long bnew = b+i;
        long long bFinal = a|bnew;
        long long op2 = i + (bFinal- bnew) +1;
        
        minOp = min({op1, op2, minOp});
        
    }
    cout<<minOp<<'\n';
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