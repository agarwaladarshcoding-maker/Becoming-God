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
    for(int i= 1 ;i<n;i++){
        if(arr[i-1]>arr[i]){
            swap(arr[i], arr[i-1]);
            arr[i] += arr[i-1];
        }
    }
    cout<<arr[n-1]<<'\n';
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