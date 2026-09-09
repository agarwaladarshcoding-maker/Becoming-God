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

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)
const long long MOD = 1e9 + 7;
long long calculate_fact(long long n)
{
    if (n == 0 || n == 1)
    {
        return 1;
    }
    long long product = 1;
    for (int i = 2; i <= n; i++)
    {
        product = (product * (i)) % MOD;
    }
    return product;
}

long long power(long long base, long long exp){
    long long res = 1;
    base = base % MOD;
    while(exp>0){
        if(exp&1){
            res = (res*base)%MOD;
        }
        base = (base * base)%MOD;
        exp >>=1;
    }
    return res;
}
long long modInverse(long long n){
    return power(n, MOD-2);
}
long long divide(long long a,  long long b){
    long long inv = modInverse(b);
    return ((a%MOD)*inv)%MOD;
}
void solve()
{
    long long n;
    long long m;
    cin >> n >> m;
    long long above = n+m - 1;
    long long below = n-1;
    long long aboveFac = calculate_fact(above);
    long long belowFacR = calculate_fact(below);
    long long belowFacNr = calculate_fact(above- below);
    long long belowToegether = (belowFacNr*belowFacR)%MOD;
    // cozx/ut<<aboveFac<<' '<<belowFacR<<' '<<belowFacNr<<' '<<belowToegether<<'\n';
    long long ans = divide(aboveFac,belowToegether );
    cout<<ans<<'\n';


}

int main()
{
    fast_io;
    solve();
    return 0;
}