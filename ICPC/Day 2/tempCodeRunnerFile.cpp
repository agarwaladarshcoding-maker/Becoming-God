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
    vector<long long> arr(n);
    vector<long long> freq(5, 0);
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
        freq[arr[i]]++;
    }
    long long ans = 0;
    // added freq 4 to thr ans
    ans += freq[4];

    // checked combination of 1 and 3
    long long adder = min(freq[3], freq[1]);


    // reduced 3
    freq[3] -= adder;

    // if 3 is still left as oe is less than 3
    if (freq[3] != 0)
    {
        ans += freq[3];
    }

    // redfuced one
    freq[1] -= adder;

    // adding to ans
    ans += adder;


    // coynting two gropus
    adder = freq[2] / 2;

    // freq2 is reduced
    freq[2] -= 2*adder;

    ans += adder;
    if (freq[2] == 0)
    {
        ans += ((freq[1]+3) / 4);
    }
    else if(freq[1]==0){
        ans+= 1;
    }
    else
    {
        if (freq[1] > 2)
        {
            ans += (1 + (((freq[1] - 2)+3) / 4));
        }
        else
        {
            ans += 1;
        }
    }
    cout << ans << '\n';
}

int main()
{
    fast_io;
    solve();
    return 0;
}