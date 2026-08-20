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
    string s;
    string t;
    cin>>s>>t;
    char start = t[0];
    vector<int> startPos;
    for(int i = 0;i<s.length();i++){
        if(s[i]==start){
            startPos.push_back(i);
        }
    }
    if(startPos.size()==0){
        cout<<"NO"<<'\n';
    }
    else{
        for(auto st : startPos){
            int left = st;
            int right = st;
            int j =0;
            while(j<n){
                
            }
            
        }
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