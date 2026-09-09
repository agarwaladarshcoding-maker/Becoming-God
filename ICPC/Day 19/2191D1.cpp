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
    int start = 0;
    for(int i = 0;i<n;i++){
        if(s[i]==')'){
            start = i;
            break;
        }
    }
    //now we need
    int length = start+1;
    int i = 0;
    int count = 0;
    while(i<n){
        if(s[i]=='('){
            count++;
            if(count==length){
                break;
            }
        }
        i++;
        
    }
    if(count!=length){
        cout<<-1<<'\n';
        return ;
    }
    i++;
    count = 0;
    while(i<n){
        if(s[i]==')'){
            count++;
            if(count==length){
                break;
            }
        }
        i++;
    }
    if(count!=length){
        cout<<-1<<'\n';
        return ;
    }
    long long ans = 2*length;
    i++;
    
    stack<char> st;
    while(i<n){
        if(st.empty()==true){
            st.push(s[i]);
        }
        else{
            if(s[i]=='('){
                st.push(s[i]);
            }
            else{
                if(st.top()=='('){
                    st.pop();
                    ans+=2;
                }
                else{
                    st.push(s[i]);
                }
            }
        }
        i++;
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