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
    long long m;
    long long n;
    cin >> m >> n;
    long long startX;
    long long startY;
    long long endX;
    long long endY;
    cin >> startX >> startY >> endX >> endY;
    startX--;
    endX--;
    startY--;
    endY--;
    vector<vector<char>> grid(m, vector<char>(n));
    for(int i= 0;i<m;i++)
    {
        for(int j =0;j<n;j++){
            cin>>grid[i][j];
        }
    }
    vector<vector<long long>> distArr(m, vector<long long>(n, INT_MAX));
    distArr[startX][startY] = 0;
    deque<pair<long long, pair<long long, long long>>> dq;
    dq.push_back({0, {startX, startY}});
    while (dq.empty() == false)
    {
        auto temp = dq.front();
        dq.pop_front();
        long long distance = temp.first;
        long long currentX = temp.second.first;
        long long currentY = temp.second.second;
        long long dx[4] = {1, -1, 0, 0};
        long long dy[4] = {0, 0, 1, -1};
        for (int i = 0; i < 4; i++)
        {
            long long nextX = currentX + dx[i];
            long long nextY = currentY + dy[i];
            if (nextX < 0 || nextX >= m || nextY < 0 || nextY >= n)
            {
                continue;
            }
            if (grid[nextX][nextY] == '#')
            {
                continue;
            }
            else
            {
                if (distArr[nextX][nextY] > distArr[currentX][currentY])
                {
                    distArr[nextX][nextY] = distArr[currentX][currentY];
                    dq.push_front({distArr[nextX][nextY], {nextX, nextY}});
                }
            }
        }
        long long dx2[24] = {-2, -2, -2, -2, -2, -1, -1, -1, -1, -1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2};
        long long dy2[24] = {-2, -1, 0, 1, 2, -2, -1, 0, 1, 2, -2, -1, 1, 2, -2, -1, 0, 1, 2, -2, -1, 0, 1, 2};
        for (int i = 0; i < 24; i++)
        {
            long long nextX = currentX + dx2[i];
            long long nextY = currentY + dy2[i];
            if (nextX < 0 || nextX >= m || nextY < 0 || nextY >= n)
            {
                continue;
            }
            if (grid[nextX][nextY] == '#')
            {
                continue;
            }
            else
            {
                if (distArr[nextX][nextY] > distArr[currentX][currentY])
                {
                    distArr[nextX][nextY] = distArr[currentX][currentY] +1 ;
                    dq.push_back({distArr[nextX][nextY], {nextX, nextY}});
                }
            }
        }
    }
    if(distArr[endX][endY]==INT32_MAX){
        cout<<-1<<'\n';
        return ;
    }
    cout<<distArr[endX][endY]<<'\n';

}

int main()
{
    fast_io;
    solve();
    return 0;
}