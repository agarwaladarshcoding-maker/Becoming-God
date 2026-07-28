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
    vector<long long> arr(n);
    for(int i =0;i<n;i++){
        cin>>arr[i];
    }
    long long countone = 0;
    long long countwo= 0;
    long long counthree =0;
    int i;
    for( i = 0;i<n;i++){
        if(arr[i]==1){
            countone++;
            if(countone>=countwo+counthree){
                break;
            }
        }
        else if(arr[i]==2){
            countwo++;
        }
        else{
            counthree++;
        }

    }
    if(i>=n-1){
        cout<<"NO"<<'\n';
        return ;
    }
    i++;
    while(countone>countwo +counthree&&arr[i]==3){
        counthree++;
        i++;
    }
    countone=0;
    countwo=0;
    counthree=0;
    while(i<n-1){
        if(arr[i]==1){
            countone++;
            if(countone+countwo>=counthree){
                break;
            }
        }
        else if(arr[i]==2){
            countwo++;
            if(countone+countwo>=counthree){
                break;
            }

        }
        else{
            counthree++;
        }
        i++;
    }
    if(i==n-1){
        cout<<"NO"<<'\n';
    }
    else{
        cout<<"YES"<<'\n';
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