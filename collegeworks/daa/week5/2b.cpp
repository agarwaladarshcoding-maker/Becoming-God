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

long long mergeAndCount(vector<long long>& arr, int left, int mid, int right) {
    vector<int> temp;
    int i = left, j = mid + 1;
    long long inv_count = 0;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp.push_back(arr[i++]);
        } else {
            temp.push_back(arr[j++]);
            inv_count += (mid - i + 1);
        }
    }
    while (i <= mid) temp.push_back(arr[i++]);
    while (j <= right) temp.push_back(arr[j++]);

    for (int k = left; k <= right; k++) {
        arr[k] = temp[k - left];
    }

    return inv_count;
}

long long mergeSortAndCount(vector<long long> &arr, long long low, long long high ){
    long long invCount = 0;
    if(low<high){
        long long mid = (low + (high-low)/2);
        invCount += mergeSortAndCount(arr, low, mid);
        invCount += mergeSortAndCount(arr, mid+1, high);
        invCount += mergeAndCount(arr, low, mid, high);
    }
    return invCount;
}
void solve() {
    long long n;
    cin>>n;
    vector<long long> arr(n);
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    long long ans = mergeSortAndCount(arr, 0, n-1);
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