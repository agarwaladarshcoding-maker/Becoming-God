#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>
#include <climits>

using namespace std;

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)

void solve()
{
    int n, m;
    cin >> n >> m;
    
    vector<string> grid(n);
    queue<pair<int, int>> mq; // Monster queue
    vector<vector<int>> monster_time(n, vector<int>(m, INT_MAX));
    
    int start_x = -1, start_y = -1;
    
    for (int i = 0; i < n; i++) {
        cin >> grid[i];
        for (int j = 0; j < m; j++) {
            if (grid[i][j] == 'M') {
                mq.push({i, j});
                monster_time[i][j] = 0; // Mark visited immediately
            } else if (grid[i][j] == 'A') {
                start_x = i;
                start_y = j;
            }
        }
    }
    
    // Direction arrays: Right, Left, Down, Up
    int dx[4] = {0, 0, 1, -1};
    int dy[4] = {1, -1, 0, 0};
    char dir_chars[4] = {'R', 'L', 'D', 'U'};
    
    // 1. Multi-source BFS for Monsters
    while (!mq.empty()) {
        auto [x, y] = mq.front();
        mq.pop();
        
        for (int i = 0; i < 4; i++) {
            int nx = x + dx[i];
            int ny = y + dy[i];
            
            // If within bounds, not a wall, and not yet visited by a monster
            if (nx >= 0 && nx < n && ny >= 0 && ny < m && grid[nx][ny] != '#') {
                if (monster_time[nx][ny] == INT_MAX) {
                    monster_time[nx][ny] = monster_time[x][y] + 1;
                    mq.push({nx, ny});
                }
            }
        }
    }
    
    // 2. BFS for the Player ('A')
    queue<pair<int, int>> pq;
    vector<vector<int>> player_time(n, vector<int>(m, INT_MAX));
    
    // Matrices to reconstruct the path
    vector<vector<int>> parent_x(n, vector<int>(m, -1));
    vector<vector<int>> parent_y(n, vector<int>(m, -1));
    vector<vector<char>> parent_dir(n, vector<char>(m, ' '));
    
    pq.push({start_x, start_y});
    player_time[start_x][start_y] = 0; // Mark visited immediately
    
    int exit_x = -1, exit_y = -1;
    
    while (!pq.empty()) {
        auto [x, y] = pq.front();
        pq.pop();
        
        // If we reached the boundary, we are done
        if (x == 0 || x == n - 1 || y == 0 || y == m - 1) {
            exit_x = x;
            exit_y = y;
            break;
        }
        
        for (int i = 0; i < 4; i++) {
            int nx = x + dx[i];
            int ny = y + dy[i];
            
            if (nx >= 0 && nx < n && ny >= 0 && ny < m && grid[nx][ny] != '#') {
                // Player must reach this cell strictly before any monster reaches it
                if (player_time[nx][ny] == INT_MAX && player_time[x][y] + 1 < monster_time[nx][ny]) {
                    player_time[nx][ny] = player_time[x][y] + 1;
                    parent_x[nx][ny] = x;
                    parent_y[nx][ny] = y;
                    parent_dir[nx][ny] = dir_chars[i];
                    pq.push({nx, ny});
                }
            }
        }
    }
    
    // 3. Evaluate Result and Backtrack
    if (exit_x == -1) {
        cout << "NO\n";
    } else {
        cout << "YES\n";
        
        string ans = "";
        int curr_x = exit_x;
        int curr_y = exit_y;
        
        // Backtrack from the exit to the start point
        while (curr_x != start_x || curr_y != start_y) {
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

int main()
{
    fast_io;
    solve();
    return 0;
}