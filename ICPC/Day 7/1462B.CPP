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
    string s;
    cin>>s;
    string target = "2020";
    //string itself
    if(s==target){
        cout<<"YES"<<'\n';
        return ;
    }
    //first part
    string firstPart = s.substr(0,4);
    if(target==firstPart){
        cout<<"YES"<<'\n';
        return ;
    }
    //end part
    string endPart = s.substr(n-4,4 );
    if(endPart==target){
        cout<<"YES"<<'\n';
        return ;
    }
    //mid part 1 , 3
    string midPart1 = s.substr(0,1) + s.substr(n-3, 3);
    string midPart2 = s.substr(0,2) + s.substr(n-2,2);
    string midPart3 = s.substr(0,3) + s.substr(n-1,1);
    if(midPart1==target||midPart2==target||midPart3==target){
        cout<<"YES"<<'\n';
        return;
    }
    cout<<"NO"<<'\n';
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