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

void solve()
{
    long long n;
    cin >> n;
    string s;
    cin >> s;
    if (n == 3)
    {
        if (s[0] == s[2])
        {
            cout << 1 << '\n';
        }
        else
        {
            cout << 2 << '\n';
        }
        return;
    }

    int i = 0;
    int ans = 0;
    vector<long long> singular;
    while(i<n){
        char ch = s[i];
        int count = 0;
        while(i<n&&s[i]==ch){
            i++;
            count++;
        }
        if(count==1){
            singular.push_back(i-1);
        }
        ans++;
    }
    long long singulars = singular.size();
    if(singulars&&singular[0]==0){
        singulars--;
    }
    if(singulars&&singular.back()==n-1){
        singulars--;
    }
    for(int i = 1;i<n-1;i++){
        if(s [i-1]==s[i+1]&&s[i]!=s[i-1]){
            cout<<ans-2<<'\n';
            return ;
        }
    }
    if(singulars>=1){
        ans--;
        cout<<ans<<'\n';
        return ;
    }
    cout<<ans<<'\n';


}


int main()
{
    fast_io;
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
    return 0;
}