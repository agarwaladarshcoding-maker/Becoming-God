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
    long long copyX = n;
    long long count= 0;
    long long digitZone = 0;
    while(n>0){
        count++;
        n=n/10;
        digitZone = 10*digitZone+1;
    }
    long long ans = 9*(count-1);
     n= copyX;
    for(int i = 1;i<=9;i++){
        long long current = digitZone*i;
        if(n>=current){
            ans++;
        }
        else{
            break;
        }
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