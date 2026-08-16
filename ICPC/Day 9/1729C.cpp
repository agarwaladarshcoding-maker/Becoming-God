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
long long indexes[26];
void createIndex(){
    for(int i= 0;i<26;i++){
        indexes[i] =i+1;
    }
}
void solve() {
    string s;
    cin>>s;
    int n = s.length();
    long long first =(long long)(s[0] -'a');
    long long end = (long long)(s[n-1] -'a');
    long long left = min(first, end);
    long long right = max(first, end);
    long long cost = abs(indexes[first] - indexes[end]);
   
    vector<pair<char, long long>> ans; 
    for(int i = 1;i<n-1;i++){
        long long current = s[i] - 'a';
        long long currentindexes = indexes[current];
        if(current>=left&&current<=right){
            ans.push_back({s[i], i+1});
        }
    }
    if(first>end){
        sort(ans.begin(), ans.end(), greater<pair<char, long long>>());
    }
    else{
        sort(ans.begin(), ans.end());
    }
    cout<<cost<<' '<<ans.size()+2<<'\n';
    cout<<1<<' ';
    for(auto i : ans){
        cout<<i.second<<' ';
    }
    cout<<n<<'\n';
    




}

int main() {
    fast_io;
    createIndex();
    int t;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}