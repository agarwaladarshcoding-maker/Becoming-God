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
    long long m;
    cin>>n>>m;
    vector<string> words(n);
    vector<string> abbreviations(m);
    vector<bool> chars(26, false);
    for(int i = 0;i<n;i++){
        cin>>words[i];
        chars[words[i][0]- 'a'] = true;
    }
    for(int i = 0;i<m;i++){
        cin>>abbreviations[i];
    }
    bool isProblem = false;
    for(int i = 0;i<m;i++){
        string temp = abbreviations[i];
        for(auto ch : temp){
            long long index = ch -'A';
            if(chars[index]==false){
                isProblem=true;
                break;
            }
        }
    }
    if(isProblem) cout<<"NO"<<'\n';
    else cout<<"YES"<<'\n';


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