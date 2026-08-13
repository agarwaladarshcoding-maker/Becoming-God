#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include<bits/stdc++.h>
using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n;
    long long m;
    cin>>n>>m;
    vector<vector<char>> grid(n, vector<char>(m));
    vector<vector<long long>> monsterTime(n, vector<long long>(m, INT_MAX));
    queue<pair<long long, long long>> monster_queue;
    long long startX = 0;
    long long startY = 0;
    for(int i = 0;i<n;i++){
        for(int j = 0;j<m;j++){
            cin>>grid[i][j];
            if(grid[i][j]=='M'){
                monster_queue.push({i,j});
                monsterTime[i][j] = 0;
            }
            else if(grid[i][j]=='A'){
                startX = i;
                startY =j;
            }
        }
    }
        // Direction arrays: Right, Left, Down, Up
    int dx[4] = {0, 0, 1, -1};
    int dy[4] = {1, -1, 0, 0};
    char dir_chars[4] = {'R', 'L', 'D', 'U'};
    //multi source mnoster bfs
    while(monster_queue.empty()==false){
        auto [x,y] = monster_queue.front();
        monster_queue.pop();
        for(int i =0;i<4;i++){
            int nx = x + dx[i];
            int ny = y + dy[i];
            if(nx>=0&&nx<n&&ny>=0&&ny<m&&grid[nx][ny]!='#'){
                if(monsterTime[nx][ny] ==INT_MAX){
                    monsterTime[nx][ny] = monsterTime[x][y] +1;
                    monster_queue.push({nx, ny});
                }
            }
        }
    }
    queue<pair<long long , long long>> q;
    vector<vector<long long>> time(n, vector<long long>(m, INT_MAX));
    time[startX][startY] = 0;
    vector<vector<int>> parent_x(n, vector<int>(m, -1));
    vector<vector<int>> parent_y(n, vector<int>(m, -1));
    vector<vector<char>> parent_dir(n, vector<char>(m, ' '));
    long long exitX = -1;
    long long exitY = -1;
    q.push({startX, startY});
    while(q.empty()==false){
        auto [ x,y ]= q.front();
        q.pop();
        if(x==0||x==n-1||y==m-1||y==0){
            exitX = x;
            exitY = y;
            break;
        }
        for (int i = 0; i < 4; i++) {
            int nx = x + dx[i];
            int ny = y + dy[i];
            
            if (nx >= 0 && nx < n && ny >= 0 && ny < m && grid[nx][ny] != '#') {
                // Player must reach this cell strictly before any monster reaches it
                if (time[nx][ny] == INT_MAX && time[x][y] + 1 < monsterTime[nx][ny]) {
                    time[nx][ny] = time[x][y] + 1;
                    parent_x[nx][ny] = x;
                    parent_y[nx][ny] = y;
                    parent_dir[nx][ny] = dir_chars[i];
                    q.push({nx, ny});
                }
            }
        }


    }
        // 3. Evaluate Result and Backtrack
    if (exitX == -1) {
        cout << "NO\n";
    } else {
        cout << "YES\n";
        string ans = "";
        int curr_x = exitX;
        int curr_y = exitY;
        
        // Backtrack from the exit to the start point
        while (curr_x != startX || curr_y != startY) {
            ans += parent_dir[curr_x][curr_y];
            int prev_x = parent_x[curr_x][curr_y];
            int prev_y = parent_y[curr_x][curr_y];
            curr_x = prev_x;
            curr_y = prev_y;
        }
        
        // Because we retraced backwards, reverse the string
        reverse(ans.begin(), ans.end());
        cout << ans.length() << "\n" << ans << "\n";
    
    }




}

int main() {
    fast_io;
   solve();
    return 0;
}