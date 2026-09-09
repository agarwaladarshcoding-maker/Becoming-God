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

long long countElement(vector<long long> &arr, long long low,  long long high, long long x){
    long long count = 0;
    for(int i = low;i<=high;i++){
        if(arr[i]==x){
            count++;
        }
    }
    return count;
}
long long majorityElement(vector<long long> &arr, long long low, long long high)
{
    if(low==high){
        return arr[low];
    }
    long long mid = (low + (high-low)/2);

    long long leftMaj = majorityElement(arr, low, mid);
    long long rightMaj = majorityElement(arr, mid+1, high);

    if(leftMaj == rightMaj){
        return leftMaj;
    }

    long long leftCount = countElement(arr, low, mid, leftMaj);
    long long rightCount = countElement(arr, mid+1, high, rightMaj);

    return leftCount>rightCount?leftMaj:rightMaj;

}
void solve() {
    long long n;
    cin>>n;
    vector<long long> arr(n);
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    long long ans = majorityElement(arr, 0, n-1);
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