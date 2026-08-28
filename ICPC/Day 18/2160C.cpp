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
bool getAns(string s, int l)
{
    int i = 0;
    int j = l - 1;
    string leftSide = "";
    string rightSide = "";
    while (i < j)
    {
        if (s[i] == s[j])
        {
            if (s[i] == '1')
            {
                leftSide.push_back('1');
                rightSide = "0" + rightSide;
            }
            else
            {
                leftSide.push_back('1');
                rightSide = "1" + rightSide;
            }
        }
        else
        {
            return false;
        }
        i++;
        j--;
    }
    return true;
}
void solve()
{
    long long n;
    cin >> n;
    string s = "";
    long long x = n;
    while (x > 0)
    {
        int lastBit = x & 1;
        if (lastBit)
            s = "1" + s;
        else
            s = "0" + s;
        x >>= 1;
    }
    int l = s.length();
    // cout<<s<<'/ '<<l<<'\n';
    if (l % 2 == 0)
    {
        if (getAns(s, l))
        {
            cout << "YES" << '\n';
            return;
        }
        else
        {
            char ch = s[l - 1];
            if(ch=='1'){
                cout<<"NO"<<'\n';
                return ;
            }
            s = ch + s;
            if (getAns(s, l+1))
            {
                cout << "YES" << '\n';
                return;
            }
        }
        cout<<"NO"<<'\n';
        return ; 
    }
    else
    {
        if(getAns(s, l)||getAns('0'+ s, l+1)){
            cout<<"YES"<<'\n';
        }
        else{
            cout<<"NO"<<'\n';
        }
    }
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