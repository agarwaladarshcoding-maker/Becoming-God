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
    vector<long long> ans(2*n, -1);
    long long number = n;
    for (int i = 0; i <2*n; i++)
    {
        if(ans[i]!=-1){
            continue;
        }
        ans[i] = number;
        ans[number+i] = number;
        number--;


    }
    for(int i= 0;i<ans.size();i++){
        cout<<ans[i]<<' ';
    }
    cout<<'\n';
    //5
    // 
    // 1 1 2 3 2  3
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