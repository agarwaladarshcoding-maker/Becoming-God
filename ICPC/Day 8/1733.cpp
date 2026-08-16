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
const long long base1 = 313;
const long long base2 = 317;
const long long mod1 = 1e9+7;
const long long mod2 = 1e9+9;



void solve()
{
    string s;
    cin>>s;
    int n = s.length();
    
    // Precompute powers
    vector<long long> pow1(n), pow2(n);
    pow1[0] = 1;
    pow2[0] = 1;
    for(int i = 1; i < n; i++){
        pow1[i] = (pow1[i-1] * base1) % mod1;
        pow2[i] = (pow2[i-1] * base2) % mod2;
    }
    
    // Precompute prefix hashes
    vector<long long> hash1_prefix(n+1), hash2_prefix(n+1);
    hash1_prefix[0] = 0;
    hash2_prefix[0] = 0;
    for(int i = 0; i < n; i++){
        hash1_prefix[i+1] = (hash1_prefix[i] * base1 + (s[i] - 'a' + 1)) % mod1;
        hash2_prefix[i+1] = (hash2_prefix[i] * base2 + (s[i] - 'a' + 1)) % mod2;
    }
    
    // Precompute suffix hashes
    vector<long long> hash1_suffix(n+1), hash2_suffix(n+1);
    hash1_suffix[0] = 0;
    hash2_suffix[0] = 0;
    for(int i = 0; i < n; i++){
        hash1_suffix[i+1] = (hash1_suffix[i] + (long long)(s[n-1-i] - 'a' + 1) * pow1[i]) % mod1;
        hash2_suffix[i+1] = (hash2_suffix[i] + (long long)(s[n-1-i] - 'a' + 1) * pow2[i]) % mod2;
    }
    
    // Find borders
    for(int len = 1; len < n; len++){
        if(hash1_prefix[len] == hash1_suffix[len] && hash2_prefix[len] == hash2_suffix[len]){
            cout << len << ' ';
        }
    }
}

int main()
{
    fast_io;
    solve();
    return 0;
}