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

void prefix_func(string s, int n, vector<long long> &pi)
{
    for (int i = 1; i < n; i++)
    {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j])
        {
            j = pi[j - 1];
        }
        if (s[i] == s[j])
        {
            j++;
            pi[i] = j;
        }
    }
}

void solve()
{
   string s;
    cin >> s;
    long long n = s.length();
    vector<long long> pi(n);
    prefix_func(s, n, pi);
    for(int i = 1;i<n;i++){
        if(pi[i-1]>pi[i]){
            cout<<pi[i-1]<<' ';
        }
    }
    if(pi[n-1]!=0){
        cout<<pi[n-1]<<' ';
    }
}

int main()
{
    fast_io;
      solve();
    
    return 0;
}