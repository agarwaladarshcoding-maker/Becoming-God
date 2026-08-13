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

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long n;
    long long m;
    cin>>n>>m;
    vector<vector<char>> grid(n, vector<char>(m));
    long long startX;
    long long startY;
    long long endX;
    long long endY;
    for(int i= 0;i<n;i++){
        for(int j =0;j<m;j++){
            cin>>grid[i][j];
            if(grid[i][j]=='A'){
                startX = i;
                startY = j;
            }
            else if(grid[i][j]=='B'){
                endX = i;
                endY = j;
            }
        }
    }
    vector<vector<long long>> parentX(n, vector<long long>(m,-1));
    vector<vector<long long>> parentY(n, vector<long long>(m,-1));
    vector<vector<char>> parentDir(n, vector<char>(m, ' '));
    vector<vector<bool>> visited(n, vector<bool>(m, false));
    int dx[4] = {1,-1,0,0};
    int dy[4] = {0,0,1,-1};
    bool reached = false;
    char dirChar[4] = {'D', 'U', 'R', 'L'};
    queue<pair<long long, long long>> q;
    q.push({startX, startY});
    while(q.empty()==false){
        auto [x,y] = q.front();
        q.pop();
        if(x==endX&&y==endY){
            reached = true;
            break;
        }

        for(int i = 0;i<4;i++){
            long long nx = x + dx[i];
            long long ny = y + dy[i];
            if(nx>=0&&nx<n&&ny>=0&&ny<m&&grid[nx][ny]!='#'&&visited[nx][ny]==false){
                visited[nx][ny] = true;
                parentX[nx][ny] = x;
                parentY[nx][ny] = y;
                parentDir[nx][ny] = dirChar[i];
                q.push({nx, ny});
            }
        }

    }
    //bacltrack
    if(reached){
        cout<<"YES"<<'\n';
        string ans = "";
        long long  currX = endX;
        long long currY = endY;
        while(currX!=startX||currY!=startY){
            ans += parentDir[currX][currY];
            long long prevX = parentX[currX][currY];
            long long prevY = parentY[currX][currY];
            currX = prevX;
            currY = prevY;
        }
        cout<<ans.length()<<'\n';
        reverse(ans.begin(), ans.end());
        cout<<ans<<'\n';
    }
    else{
        cout<<"NO"<<'\n';
    }


}

int main() {
    fast_io;
    solve();
    return 0;
}