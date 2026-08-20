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
    vector<long long> bea(n+1);
    vector<long long> ver(m+1);
    for(int i = 0;i<n;i++){
        cin>>bea[i];
    }
    bea[n] = 1;
    for(int i = 0;i<m;i++){
        cin>>ver[i];
    }
    ver[m] = 1;
    long long throwbea  =0;
    long long throwver = 0;
    for(int i = 0;i<n;i++){
        long long countpossible = bea[i] - bea[i+1] +1;
        throwbea += countpossible;
    }
    for(int i = 0;i<m;i++){
        long long countpossible = ver[i] - ver[i+1] +1;
        throwver += countpossible;
    }
    if(throwbea>=throwver) cout<<1<<'\n';
    else cout<<2<<'\n';

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