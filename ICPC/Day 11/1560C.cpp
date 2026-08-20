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
    double k;
    cin>>k;
    double pos;
    pos = sqrt(double(k));
    if(pos==(long long)(pos)){
        cout<<pos<<' '<<1<<'\n';
        return ;
    }
    long long intpos = pos ;
    long long startPoint = (intpos * intpos)+1;
    long long endPoint = (intpos+1)*(intpos+1);
    if(startPoint+ intpos==k ){
        cout<<intpos+1<<' '<<intpos+1<<'\n';
    }
    else if(startPoint+ intpos>(long long)k){
       
        cout<<k- startPoint +1<<' '<<intpos+1<<'\n';
    }
    else{
   
        cout<<intpos+1<<' '<<(endPoint - k +1)<<'\n';
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