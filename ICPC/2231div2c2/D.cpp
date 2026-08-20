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
    long long area;
    long long queries;
    cin >> area >> queries;
    vector<pair<long long, long long>> sides(queries);
    for (int i = 0; i < queries; i++)
    {
        long long x;
        long long y;
        cin >> x >> y;
        sides[i] = {x, y};
    }
    set<pair<long long, long long>> rectangels;
    for (int i = 1; i <= sqrt(area); i++)
    {
        if (area % i == 0)
            rectangels.insert({i, area / i});
        rectangels.insert({area / i, i});
    }
    for (auto q : sides)
    {
        auto [x, y] = q;
        vector<pair<long long, long long>> validRectangles;
        // valid ones
        for (auto rectangle : rectangels)
        {
            validRectangles.push_back({min(rectangle.first, x), min(rectangle.second, y)});
            cout << validRectangles.back().first << " " << validRectangles.back().second << '\n';
            long long areas = 0;
            for (int i = 0; i < validRectangles.size(); i++)
            {
                areas += (validRectangles[i].first * validRectangles[i].second);
                for (int j = i + 1; i < validRectangles.size(); j++)
                {
                    long long subtract = min(validRectangles[i].first, validRectangles[j].first) * min(validRectangles[i].second , validRectangles[j].second);
                    areas -= subtract;
                }
            }
            cout << areas << '\n';
        }

        // now remove the overlaps
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