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
bool isPossible(long long n, long long k, long long mid){
    long long base = 1;
    long long sum =0;
    while(mid>=base){
        sum += (mid/base);
        base = base*k;
    }
    if(sum>=n){
        return true;
    }
    return false;
}
void solve() {
    long long n;
    long long k;
    cin>>n>>k;
    long long low = 1;
    long long high = n;
    long long ans = 0;
    while(low<=high){
        long long mid = (low ) + (high- low)/2;
        if(isPossible(n, k, mid)){
            
            ans = mid;
            high = mid -1;
        }
        else{
            low = mid +1;
        }
    }
    cout<<ans<<'\n';
}

int main() {
    fast_io;
    solve();
    return 0;
}