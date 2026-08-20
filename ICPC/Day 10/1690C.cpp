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
    vector<long long> startTime(n);
    for(int i= 0;i<n;i++){
        cin>>startTime[i];
    }
    vector<long long> endTime(n);
    for(int i = 0;i<n;i++){
        cin>>endTime[i];
    }
    long long startwhen = 0;
    long long finishwhen = 0;
    for(int i = 0;i<n;i++){
        startwhen = max(finishwhen, startTime[i]);
        cout<<endTime[i] - startwhen<<' ';
        finishwhen = endTime[i];
    }
    cout<<'\n';

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