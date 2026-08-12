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
    long long x;
    long long y;
    cin>>n>>m>>x>>y;
    set<long long, greater<long long>> st;
    for(int i = 0;i<x;i++){
        long long u;
        cin>>u;
        st.insert(u);
    }
    for(int i = 0;i<y;i++){
        long long v;
        cin>>v;
        st.insert(v);
    }
    long long req = m+n-1;
    long long ans = 0;
    while(req>0&&st.size()!=0){
        ans += *(st.begin());
        req--;
        st.erase(st.begin());

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