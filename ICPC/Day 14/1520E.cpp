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
    string s;
    cin>>n>>s;
    vector<long long> positions;
    for(int i = 0;i<n;i++){
        if(s[i]=='*'){
            positions.push_back(i+1);
        }
    }
    long long size = positions.size();
    if(size==0){
        cout<<0<<'\n';
        return ;
    }
    long long median = positions[size/2];
    long long ans = 0;
    for(int i = 0;i<size;i++){
        long long distance = abs(median - positions[i]);
        long long indexdiff = abs((size/2) - i);
        // cout<<distance<<' '<<indexdiff<<'\n';
        ans += (distance- indexdiff);
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