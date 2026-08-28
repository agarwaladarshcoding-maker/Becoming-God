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
    long long m;
    cin>>n>>m;
    vector<long long> a(n);
    a[0] = 1;
    for(int i = 1;i<n;i++){
        cin>>a[i];
    }
    vector<long long> b(n);
    for(int i = 0;i<n;i++){
        cin>>b[i];
    }
    long long ans = n;
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());
    int i = 0;
    int j = 0;
    while(i<n&&j<n){
        if(a[i]<b[j]){
            i++;
            j++;
        }
        else{
            j++;
            ans--;
        }
    }
    cout<<n- ans<<'\n';
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