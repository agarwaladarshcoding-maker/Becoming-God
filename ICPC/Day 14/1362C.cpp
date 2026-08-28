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
    long long number = 1;
    long long ans = 0;
    for(int i = 0;i<=64;i++){
        if(i==0) number = 1;
        else number *=2;
        if(number>n){
            break;
        }
        long long size = (number);
        long long adder = n/size;
        ans += adder;
    }
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