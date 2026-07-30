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
    long long minKValue = -1;

    for(int i= 1;i<n;i++){
        if(arr[i-1]>arr[i]&&minKValue==-1){
            minKValue = arr[i-1]- arr[i];
            arr[i] = arr[i-1];
        }
        else if(arr[i-1]>arr[i]){
            if(arr[i]+minKValue>=arr[i-1]){
                arr[i] +=minKValue;
            }
            else if(arr[i]+minKValue<arr[i-1]){
                cout<<"NO"<<'\n';
                return ;
            }
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