#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

int dx[4] = {0, 0, 1, -1};
int dy[4] = {1, -1, 0, 0};
char dirChar[4] = {'R', 'L', 'D', 'U'};

void solve() {
    int m, n;
    cin >> m >> n;
    
    // Using vector<string> is cache-friendly and slightly faster to read
    vector<string> grid(m);
    pair<int, int> stp, endp;
    
    for(int i = 0; i < m; i++){
        cin >> grid[i];
        for(int j = 0; j < n; j++){
            if(grid[i][j] == 'A') stp = {i, j};
            else if(grid[i][j] == 'B') endp = {i, j};            
        }
    }
  
    vector<vector<bool>> visited(m, vector<bool>(n, false));
    // Stores the direction index (0,1,2,3) used to arrive at grid[i][j]
    vector<vector<int>> parentDir(m, vector<int>(n, -1)); 
    
    queue<pair<int, int>> q;
    q.push(stp);
    visited[stp.first][stp.second] = true;
    
    bool found = false;

    while(!q.empty()){
        pair<int, int> pos = q.front();
        q.pop();
        
        if(pos == endp) {
            found = true;
            break;
        }
        
        for(int i = 0; i < 4; i++){
            int x = pos.first + dx[i];
            int y = pos.second + dy[i];
            
            if(x >= 0 && x < m && y >= 0 && y < n && !visited[x][y] && grid[x][y] != '#'){
                visited[x][y] = true;      // Mark immediately on discovery
                parentDir[x][y] = i;       // Log how we got here
                q.push({x, y});
            }
        }
    }
    
    if(found) {
        cout << "YES\n";
        string path = "";
        pair<int, int> curr = endp;
        
        // Backtrack from end to start
        while(curr != stp) {
            int d = parentDir[curr.first][curr.second];
            path += dirChar[d];
            
            // Move backwards to the parent node
            curr.first -= dx[d];
            curr.second -= dy[d];
        }
        
        // Reverse the string because we traced from B to A
        reverse(path.begin(), path.end());
        
        cout << path.length() << '\n';
        cout << path << '\n';
    } else {
        cout << "NO\n";
    }
}

int main(){
    fast_io; // Don't forget to execute your macro to speed up cin/cout
    solve();
    return 0;
}