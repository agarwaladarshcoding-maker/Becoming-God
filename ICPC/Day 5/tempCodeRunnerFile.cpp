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
    vector<long long> inexp(n);
    for(int i=0;i<n;i++){
        cin>>inexp[i];
    }
    vector<long long> freq(n+1, 0);
    for(int i= 0;i<n;i++){
        freq[inexp[i]]++;
    }
    long long ans = 0;
    long long carryOver = 0;
    for(int i = 1;i<=n;i++){
        if(freq[i]+carryOver>=i){
            if(freq[i]>=i){
                long long count = freq[i]/i;
                ans += count;
                freq[i]-=i*count;
                carryOver+= freq[i];
            }
            else{
                long long count = (freq[i]+carryOver)/i;
                ans+=count;
                freq[i] = 0;
                carryOver = (freq[i]+carryOver) - i*count;  
            }
           
        }
        else{
            carryOver+=freq[i];
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