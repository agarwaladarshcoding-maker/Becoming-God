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
    long long a;
    long long b;
    long long c;
    cin>>a>>b>>c;
    long long count = 0;
    while(true){
        if(a==b||b==c||c==a){

            cout<<count<<'\n';
            break;
        }
        count++;
        if(a>b&&a>c){
            if(b>c){
                a--;
                c++;
            }
            else{
                a--;
                b++;
            }
        }
        else if(b>c&&b>a)
        {
            if(a>c){
                b--;
                c++;
            }
            else{
                b--;
                a++;
            }
        }
        else{
            if(a>b){
                c--;
                b++;
            }
            else{
                c--;
                a++;
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