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
    vector<long long> prices(n);
    for(int i= 0;i<n;i++){
        cin>>prices[i];
    }
    long long q;
    cin>>q;
    vector<long long> coins(q);
    for(int i= 0;i<q;i++){
        long long coin;
        cin>>coin;
        coins[i]= coin;
    }
    sort(prices.begin(), prices.end());
    for(int i= 0;i<q;i++){
        long long pocket = coins[i];
        auto it = upper_bound(prices.begin(), prices.end(),pocket);
        long long days = n - (prices.end()-it);
        cout<<days<<'\n';

        


    }
}

int main() {
    fast_io;
    solve();
    return 0;
}