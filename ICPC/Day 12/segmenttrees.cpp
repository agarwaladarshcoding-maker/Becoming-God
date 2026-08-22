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
vector<long long> segmentindex(4*100005);
vector<long long> arr(100005);
long long buildSegmentTrees(long long index, long long low, long long high){
    if(low==high){
        return segmentindex[index] = low;
    }
    long long mid = (low  + (high-low)/2);
    long long path1 = buildSegmentTrees(2*index+1, low, mid);
    long long path2 = buildSegmentTrees(2*index+2, mid+1, high);
    return segmentindex[index]= min(path1, path2);
}
long long query(long long index, long long low, long long high, long long l, long long r){
    if(high < l || low > r){
        return LLONG_MAX;
    }
    if(low >= l && high <= r){
        return segmentindex[index];
    }
    // Case 3: partial overlap — recurse both sides and combine
    long long mid = low + (high - low) / 2;
    long long leftAns  = query(2*index+1, low, mid, l, r);
    long long rightAns = query(2*index+2, mid+1, high, l, r);
    return min(leftAns, rightAns);
}
void update(long long index, long long low, long long high, long long pos, long long newVal){
    if(low == high){
        arr[pos] = newVal;
        segmentindex[index] = newVal;
        return;
    }
    long long mid = low + (high-low)/2;
    if(pos <= mid)
        update(2*index+1, low, mid, pos, newVal);
    else
        update(2*index+2, mid+1, high, pos, newVal);

    segmentindex[index] = min(segmentindex[2*index+1], segmentindex[2*index+2]);
}
void solve() {
    
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