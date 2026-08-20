#include <iostream>
#include <string>

using namespace std;

void solve()
{
    string s;
    cin >> s;
    int freq[26] = {};
    for (auto ch : s)
    {
        ++freq[ch - 'A'];
    }

    int oddCount = 0;
    int middle = -1;
    for (int i = 0; i < 26; i++)
    {
        if (freq[i] % 2 != 0)
        {
            ++oddCount;
            middle = i;
        }
    }

    if (oddCount > 1)
    {
        cout << "NO SOLUTION\n";
        return;
    }

    string left;
    left.reserve(s.size() / 2);
    for (int i = 0; i < 26; ++i)
    {
        left.append(freq[i] / 2, 'A' + i);
    }

    string answer = left;
    if (middle != -1)
    {
        answer += 'A' + middle;
    }
    answer.append(left.rbegin(), left.rend());
    cout << answer << '\n';
}

int main()
{
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}