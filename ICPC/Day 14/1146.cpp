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
    long long ans = 0;
    long long start = 0;
    long long size = 0;
    for(int i = 0;i<64;i++){
        if(i==0) start = 1;
        else start *=2;
        if(start>n){
            break;
        }
        size = 2*start;
        long long useless= start-1;
        long long totalGroups = (n- useless)/size;
        long long adding = start*totalGroups;
        long long extras = min((n-useless)%size, start);
        adding += extras;
        // cout<<adding<<'\n';
        ans += adding;
    }
    cout<<ans<<'\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}