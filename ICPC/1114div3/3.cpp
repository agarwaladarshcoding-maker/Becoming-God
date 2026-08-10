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
    string a;
    string b;
    cin>>n>>a>>b;
    if(n<3&&a==b){
        cout<<"YES"<<'\n';
    }
    else if(n<3&&a!=b){
        cout<<"NO"<<'\n';
    }
    else{
        
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