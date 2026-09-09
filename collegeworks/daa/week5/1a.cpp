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
    vector<long long> arr(n);
    for(int i= 0;i<n;i++){
        cin>>arr[i];
    }
    pair<long long ,long long> maxi = {0, 1};
    for(int i = 0;i<n;i++){
        long long count = 1;
        for(int j = i+1;j<n;j++){
            if(arr[i]==arr[j]){
                count++;
            }
        }
        if(maxi.second<count){
            maxi.first = i;
            maxi.second = count;
        }
    }
    cout<<maxi.first<<' '<<maxi.second<<'\n';
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