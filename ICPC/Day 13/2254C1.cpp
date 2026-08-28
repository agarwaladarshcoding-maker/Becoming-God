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
    string s;
    string t;
    cin>>n>>s>>t;
    pair<long long, long long> scount;
    pair<long long, long long> tcount;
    long long evenCount = 0;
    long long oddCount = 0;
    for(int i = 0;i<n;i++){
        if(i%2==0&&s[i]=='1')
        evenCount++;
        else if(i%2!=0&&s[i]=='1')
        oddCount++;
    }
    scount = {evenCount, oddCount};
    evenCount = 0;
    oddCount = 0;
     for(int i = 0;i<n;i++){
        if(i%2==0&&t[i]=='1')
        evenCount++;
        else if(i%2!=0&&t[i]=='1')
        oddCount++;
    }
    tcount = {evenCount, oddCount};
    if(scount.first==tcount.first&&scount.second==tcount.second){
        cout<<"YES"<<'\n';
    }
    else{
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