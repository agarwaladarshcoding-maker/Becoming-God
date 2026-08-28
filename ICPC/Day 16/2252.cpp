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
    long long m;
    long long n;
    cin>>m>>n;
    vector<long long> totalStability(m);
    for(int i = 0;i<m;i++){
        cin>>totalStability[i];
    }
    vector<vector<long long>> stabilities(m, vector<long long>(n));
    multiset<pair<long long, long long>, std::greater<pair<long long, long long>>> pq;
    for(int i= 0;i<m;i++){
        for(int j =0;j<n;j++){
            cin>>stabilities[i][j];
            pq.insert({ stabilities[i][j], i});
        }
    }
    long long ans = n;
    for(int i = 0;i<m;i++){
        long long target = totalStability[i];
        vector<pair<long long, long long> > outing;
        long long j = 0;
        while(j<n&&target>0){
            auto top = *(pq.begin());
            outing.push_back(top);
            pq.erase(pq.begin());
            target = target - top.first;
            // cout<<target<<'\n';
            j++;
        }
        ans = min(ans, j);
        while(outing.empty()==false){
            pq.insert(outing.back());
            outing.pop_back();
        }
        for(int j=0;j<n;j++){
            pq.erase({ stabilities[i][j], i});
        }
    
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