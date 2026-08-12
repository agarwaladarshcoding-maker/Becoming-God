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
    string target;
    cin>>s>>target;
    if(target.length()>s.length()){
        cout<<0<<'\n';
    }
    else if(target.length()==s.length()&&s==target){
        cout<<1<<'\n';
    }
    else if(target.length()==s.length()&&s!=target){
        cout<<0<<'\n';
    }
    else{
        long long l1 = s.length();
        long long l2 = target.length();
        string word ="";
        long long ans = 0;
        for(int i = 0;i<l1;){
            word+=s[i];
            if(word.length()<target.length()){
                i++;
            }
            else{
                if(word==target){
                    ans++;
                    word = "";
                    i++;
                }
                else{
                    word = word.erase(0,1);
                    
                    i++;
                }
            }
        }
        cout<<ans<<'\n';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}