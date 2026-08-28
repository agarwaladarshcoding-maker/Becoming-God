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
    long long k;
    cin>>k;
    vector<long long> S(n);
    vector<long long> T(n);
    unordered_map<long long , long long> smap;
    unordered_map<long long, long long> tmap;
    for(int i = 0;i<n;i++){
        cin>>S[i];
        S[i] = S[i]%k;
        smap[S[i]]++;
    }
    for(int i = 0;i<n;i++){
        cin>>T[i];
        T[i] = T[i]%k;
        tmap[T[i]]++;
    }
    for(auto [i, j]: smap , tmap){
        if(i !=j){
            cout<<"NO"<<'\n';
            return ;
        }
    }
    cout<<"YES"<<'\n';

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