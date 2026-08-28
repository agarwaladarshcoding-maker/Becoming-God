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
    vector<long long> a(n);
    vector<long long> b(n);
    for(int i = 0;i<n;i++){
        cin>>a[i];
    }
    for(int i = 0;i<n;i++){
        cin>>b[i];
    }
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());
    int i = 0;
    long long ans = 0;
    while(i<n){
        long long x = (b[i]+1)*a[i] + b[i];
        long long y = b[i]+1;
        if(x<=k&&y<=k){
            ans++;
        }
        i++;
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