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
    deque<long long> dq;
    priority_queue<pair<long long, long long>> pq;
    for(int i = 0;i<n;i++){
        long long x;
        cin>>x;
        dq.push_back(x);
        pq.push({x, i});
    }
    long long index = 0;
    while(dq.empty()==false){
        long long firstElement = dq.front();
        long long top = pq.top();
        
    }

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