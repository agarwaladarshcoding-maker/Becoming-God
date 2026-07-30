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
    long long k;
    cin>>n>>k;
    if(k>n){
        cout<<"NO"<<'\n';
    }
    else if(k==n){
        cout<<"YES"<<'\n';
        for(int i = 0;i<k;i++){
            cout<<1<<' ';
        }
        cout<<'\n';
    }
    else{
        //case 1: do with ones
        long long left = n- (k-1);
        if(left%2!=0){
            cout<<"YES"<<'\n';
            for(int i = 1;i<k;i++){
                cout<<1<<' ';
            }
            cout<<left<<'\n';
            return ;
        }
         left = n- 2*(k-1);
        if(left>0&&left%2==0){
                      cout<<"YES"<<'\n';
            for (int i = 0; i < k-1; i++)
            {
                cout<<2<<' ';
            }
            cout<<left<<'\n';
            return ;
            
        }
        cout<<"NO"<<'\n';
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