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
    long long c;
    cin>>n>>c;
    vector<long long> arr(n);
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    sort(arr.begin(), arr.end());
    long long ans = 0;
    vector<long long> types(n);
    for(int i = 0;i<n;i++){
        if(arr[i]>=c){
            types[i] = 1;
        }
        else{
            types[i] = 0;
        }
    }
    int i = 0;
    int j = n-1;
    while(i<=j&&types[i]==0){
        ans += (arr[j] - c);
        i++;
        j--;
    }
    while(i<=j){
        
        ans += (arr[j]- c);
        j--;
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