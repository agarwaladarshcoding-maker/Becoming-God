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
    long long x;
    long long y;
    cin>>x>>y;
    long long maxi = x+ y;
    long long maxi2 = x+ y;
    long long x2 = x;
    string bits = "";
    while(x>0){
        // cout<<"hello"<<'\n';
        if(maxi&1){
            bits = bits + '1';
        }
        else{
            bits = bits + '0';
        }
        x>>=1;
        maxi>>=1;
    }
  
    long long ans = 0;
    long long base = 1;
    for(int i = bits.length()-1;i>=0;i--){
        if(bits[i]=='1'){
            ans += base;
        }
        base = base *2;
    }
    cout<<maxi2<<' '<<x2- ans<<'\n';

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