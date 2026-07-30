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
const long long MOD = 1e9+7;
void solve() {
    long long n;
    cin>>n;
    vector<vector<char>> grid(n, vector<char>(n));
    vector<vector<long long>> dp(n, vector<long long>(n, 0));
    for(int i= 0;i<n;i++){
        for(int j =0;j<n;j++){
            cin>>grid[i][j];
        }
    }
    dp[0][0] = 1;
    for(int i =0;i<n;i++){
        for(int j= 0;j<n;j++){
            if(grid[i][j]=='*'){
                dp[i][j] = 0;
            }
            else{
                if(i>=1){
                    dp[i][j] = ((dp[i][j])+ (dp[i-1][j]))%MOD;
                }
                if(j>=1){
                     dp[i][j] = ((dp[i][j])+ (dp[i][j-1]))%MOD;
                }
            }
        }
    }
    cout<<(dp[n-1][n-1]%MOD)<<'\n';

}

int main() {
    fast_io;
    solve();
    return 0;
}