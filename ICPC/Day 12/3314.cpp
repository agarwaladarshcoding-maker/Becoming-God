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

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)

const long long N = 2*100005;
vector<long long> segIndex(4*N,0);
vector<long long> arr(N);
long long buildSegmentTree(long long index, long long low, long long high){
    if(low==high){
        return segIndex[index] = low;
    }
    long long mid = low + (high-low)/2;
    long long path1 = buildSegmentTree(2*index+1, low, mid);
    long long path2 = buildSegmentTree(2*index+2, mid+1, high);
    if(arr[path1]>arr[path2]){
        return segIndex[index] = path1;
    }
    else{
        return segIndex[index] =  path2;
    }
}
long long querySegmentTrees(long long index, long long low, long long high, long long l, long long r){
    if(low>=l&&high<=r){
        return segIndex[index];
    }
    if(low>r||high<l){
        return -1;
    }
    long long mid = low + (high-low)/2;
    long long path1 = querySegmentTrees(2*index+1, low, mid, l, r);
    long long path2 = querySegmentTrees(2*index+2, mid+1, high, l, r);
    if(path1==-1) return path2;
    if (path2==-1) return path1;
    return (arr[path1]>arr[path2])? path1:path2;
}
long long getAns(long long l, long long r, long long n){
    if (l > r) return 0;
    if (l == r) return 1;

    long long highPos = querySegmentTrees(0, 0, n - 1, l, r);
    if (highPos < l || highPos > r) return 1;

    long long left = 0;
    long long right = 0;
    if (highPos > l) left = getAns(l, highPos - 1, n);
    if (highPos < r) right = getAns(highPos + 1, r, n);

    return 1 + max(left, right);
}
void solve(){
    long long n;
    cin>>n;
    for(int i = 0;i<n;i++){
        cin>>arr[i];
    }
    long long low = 0;
    long long high = n-1;
    buildSegmentTree(0, low, high);
    cout<<getAns( low, high, n)<<'\n';
}

int main()
{
    fast_io;
    solve();

    return 0;
}