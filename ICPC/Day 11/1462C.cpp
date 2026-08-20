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
    long long x;
    cin>>x;
    if(x>45){
        cout<<-1<<'\n';
    }
    else if(x<=9){
        cout<<x<<'\n';
    }
    else{
        vector<int> visited(10, false);
        for(int i = 9;i>=1;i--){
            if(x>=i){
                visited[i]= true;
                x = x-i;
            }
            else{
                continue;
            }
        }
        long long ans = 0;
        for(int i = 1;i<=9;i++){
            if(visited[i]){
                ans = 10* ans + i;
            }
        }
        cout<<ans<<'\n';
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