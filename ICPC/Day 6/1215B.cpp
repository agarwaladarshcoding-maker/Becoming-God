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
    vector<long long> arr(n);
    vector<long long> negatives;
    negatives.push_back(0);
    for(int i= 0;i<n;i++){
        cin>>arr[i];
        if(arr[i]<0){
            negatives.push_back(i);
        }
    }
    negatives.push_back(n-1);
    long long totalNeg  = 0;
    long long totalPos = (n*(n+1))/2;
    for(int i = 1;i<negatives.size()-1;i=i+2){
        long long diffleft = negatives[i] - negatives[i-1];
        long long diffright = negatives[i+1] - negatives[i];
        long long ans = (diffleft* diffright) +1;
        totalNeg +=ans;
        cout<<ans<<'\n';
    }
    for(int i = negatives.size()-2;i>=1;i=i-2){
        long long diffleft = negatives[i] - negatives[i-1];
        long long diffright = negatives[i+1] - negatives[i];
        long long ans = (diffleft* diffright) +1;
        totalNeg +=ans;
        cout<<ans<<'\n';
    }
    totalNeg += (negatives.size()-2);
    totalPos -=totalNeg;
    cout<<totalNeg<<' '<<totalPos<<'\n';

}

int main() {
    fast_io;
    solve();
    return 0;
}