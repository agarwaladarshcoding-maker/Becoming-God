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
    long long q;
    cin>>n>>q;
    vector<long long> arr(n);
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    vector<pair<long long, long long> > queries(q);
    for(int i= 0;i<q;i++){
        long long x;
        long long y; 
        cin>>x>>y;
        queries[i] = {x,y};
    }
    vector<long long> prefix(n+1, 0);
    for(int i = 1;i<=n;i++){
        prefix[i] = prefix[i-1]^arr[i-1];
    }
    for(auto q: queries){
        long long left = q.first ;
        long long right = q.second;
        cout<<(prefix[right]^prefix[left-1])<<'\n';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}