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
vector<long long> logTable(17);
vector<vector<long long>> sparseTable(100005, vector<long long>(17));
vector<long long> arr(100005);
void buildLogTable(int n){
    logTable[1] = 0;
    for(int i= 2;i<=n;i++){
        logTable[i] = logTable[i/2] +1;
    }
}
void buildSparseTable(int n ){
    for (int i = 0; i < n; i++)
    {
        sparseTable[i][0] = arr[i];
    }
    for(int j = 1;(1<<j)<=n;j++){
        for(int i = 0;i+ (1<<j) - 1<n;i++){
            sparseTable[i][j] = min(sparseTable[i][j-1], sparseTable[i + (1<<(j-1))][j-1]);
        }
    }  
}
long long getAns(long long l, long long r ){
    long long ans = 0;
    long long length = r - l +1;
    long long k = logTable[length];
    ans = min(sparseTable[l][k] , sparseTable[r - (1<<k)+1][k]);
    return ans;
}

int main() {
    int n;
    cin >> n;
    for (int i = 0; i < n; i++)
        cin >> arr[i];

    buildLogTable(n);
    buildSparseTable(n);

    int q;
    cin >> q;
    while (q--) {
        int L, R;
        cin >> L >> R;              // 0-indexed, inclusive
        cout << getAns(L, R) << "\n";
    }
    return 0;
}