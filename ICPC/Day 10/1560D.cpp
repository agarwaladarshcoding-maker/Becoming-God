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
long long getMoves(long long n, long long target){
    if(n==target){
        return 0;
    }
    string nstring = to_string(n);
    string targetstring = to_string(target);
  
    long long nl=  nstring.length();
    long long targetl = targetstring.length();
    int i= 0;
    int j = 0;
    long long count = 0;
    while(i<nl&&j<targetl){
        if(nstring[i]==targetstring[j]){
            i++;
            j++;
        }
        else{
            count++;
            i++;
        }
    }
    count +=(targetl-j) + (nl - i);
    return count;
    
   

}
void solve() {
    long long n;
    cin>>n;
    long long target = 1;
    long long minMoves = INT64_MAX;
    for(int i = 1;i<=62;i++){
        if(i!=1) target *=2;
   
        minMoves = min(minMoves, getMoves(n, target));
    }
    cout<<minMoves<<'\n';
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