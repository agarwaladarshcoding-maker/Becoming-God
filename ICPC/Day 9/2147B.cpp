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
    vector<long long> ans(2*n, -1);
    long long mid = (n+2)/2;
    long long index = 0;
    long long index2 = n;
    for(int i = n;i>=mid;i--){
        ans[index] = i;
        ans[index2] = i;
        index2++;
        index +=2;
    }
    long long unvisited = -1;
    long long currentnumber = mid-1;
    for(int i= 0;i<2*n;i++){
        if(ans[i]==-1){
            unvisited = i;
        }
        if(unvisited!=-1){
            ans[i] = currentnumber;
            int indexes = i;
            while(ans[indexes]!=-1){
                indexes += currentnumber;
            }
            ans[indexes] = currentnumber;
            currentnumber --;
            unvisited = -1;
        }
    }
    for(auto i : ans){
        cout<<i<<' ';
    }
    cout<<'\n';
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