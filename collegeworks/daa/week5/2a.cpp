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
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    long long count = 0; 
    for(int i = 0;i<n;i++){
        for(int j = i+1;j<n;j++){
            if(arr[j]<arr[i]){
                count++;
            }
        }
    }
    cout<<count<<'\n';
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