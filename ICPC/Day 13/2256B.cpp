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
    auto check_pattern = [&](long long startIndex, long long startType){
        long long currentType = startType;
        for(int i = startIndex;i<n;i=i+2){
            if(s[i]!='?'&&(s[i]-'0')!=currentType){
                return 0;
            }
            currentType =1 - currentType;
        }
        return 1;
    };
    long long oddAmount = check_pattern(0, 0) + check_pattern(0,1);
    long long evenAmount = check_pattern(1, 0) + check_pattern(1,1);
    long long ans = oddAmount*evenAmount;
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