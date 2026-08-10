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
    vector<long long> b(n);
    vector<long long> a(n);
    for(int i = 0;i<n;i++){
        cin>>b[i];
        a[i] = b[i];
    }
    sort(b.begin(), b.end());
    if(b[0]!=0){
        cout<<-1<<'\n';
        return ;
    }
    map<long long, long long> answers;
    long long prefixSum = 0;
    int i= 0;
    long long lastNumber = 0;
    while(i<n){
        long long current = b[i];
        int times = 0;
    
        while(i<n&&current==b[i]){
            times++;
            i++;
        }
        // cout<<current <<' '<<times<<' '<<i<<' '<<'\n';
        if(i==n){
            answers[current] = lastNumber+1;
        }
        else{
            long long targetSum = b[i];
            long long needed = targetSum- prefixSum;
            if(needed%times!=0){
                cout<<-1<<'\n';
                return ;
            }
            else{
                long long ans = needed/times;
                if(lastNumber>=ans){
                    cout<<-1<<'\n';
                    return; 
                }
                answers[current] = ans;
                lastNumber = ans;
                prefixSum += needed;
            }
        }
    }
    for(int i= 0;i<n;i++){
        cout<<answers[a[i]]<<' ';
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