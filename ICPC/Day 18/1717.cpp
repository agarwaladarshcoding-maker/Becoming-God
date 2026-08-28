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
const long long MOD = 1e9+7;
void solve() {
    long long n;
    cin>>n;
    long long prev1 = 1;
    long long prev2 = 0;
    if(n==1){
        cout<<0<<'\n';
    }
    else if(n==2){
        cout<<1<<'\n';
    }
    else{
        for(int i = 3;i<=n;i++){
            long long temp = (((i-1)%MOD)*((prev1+ prev2)%MOD)%MOD);
            prev2 = prev1;
            prev1 = temp;
        }
        cout<<prev1<<'\n';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}