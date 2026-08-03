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
    vector<string> names(n);
    for(int i =0;i<n;i++){
        cin>>names[i];
    }
    map<string, long long> st;
    for(int i= 0;i<n;i++){
        string temp = names[i];
        string newStr = "";
        int j= 0;
        while(j<temp.length()&&isdigit(temp[j])==false){
            j++;
        }
       
        temp = temp.substr(0, j);
        // cou/t<<temp<<'\n';
        names[i] = temp;
        
        if(st.count(names[i])==0){
            cout<<"OK"<<'\n';
            st[names[i]] = 1;
        }
        else{
            cout<<names[i]<<to_string(st[names[i]])<<'\n';
            st[names[i]]++;
        }
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}