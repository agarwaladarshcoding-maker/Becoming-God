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
    if(n%2!=0){
        cout<<-1<<'\n';
    }
    else{
        long long count = 1;
        for(int i = 1;i<=n;i=i+2){
            cout<<count<<' '<<count<<' ';
            count++;
        }
        cout<<'\n';
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