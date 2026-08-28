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
    long long a;
    long long b;
    cin>>a>>b;
    if (a==b)
    {
        cout<<0<<'\n';
        return ;
    }
    
    vector<long long> ans;
    long long base = 1;
    while(b>0){
        int lastBitb = (b&1);
        if(lastBitb==1){
            if(base<=a){
            ans.push_back(base);
            }
            else{
                cout<<-1<<'\n';
                return ; 
            }
        }
        b>>=1;
        base<<=1;
    }
    cout<<ans.size()<<'\n';
    for(auto i : ans){
        cout<<i<<' ';
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