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
    cin>>n>>s;
    int i = 0;
    int length = 0;
    vector<long long> ans(n);
    while(i<n){
        char ch = s[i];
        while(i<n&&s[i]==ch){
            i++;
            length++;
        }
        if(ch=='0'&&length==1){
            cout<<"NO"<<'\n';
            return ;
        }
        else if(ch=='0'&&length!=1){
            int j = i;
            int indexes = i- length+1;
            int temp = length;
            while(length>0){
                ans[j- length] = indexes;
                length--; 
                indexes++;
            }
            length = temp;
            while(length-1>0){
                swap(ans[j-length], ans[j-length+1]);
                length--;
            }
        }
        else{
            int j = i;
            int indexes = i- length+1;
            while(length>0){
                ans[j- length] = indexes;
                length--; 
                indexes++;
            }
        }
        length = 0;
    }
    cout<<"YES"<<'\n';
    for(auto i : ans){
        cout<<i<<' ';
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