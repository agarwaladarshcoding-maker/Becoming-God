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
    cin>>n;
    long long m;
    cin>>m;
    vector<vector<long long>> adjList(n+1);
    vector<long long> inorder(n+1);
    for(int i = 0;i<m;i++){
        long long a;
        long long b;
        cin>>a>>b;
        adjList[a].push_back(b);
        inorder[b]++;
    }
    vector<long long> ans;
    queue<long long> q;
    for(int i = 1;i<=n;i++){
        if(inorder[i]==0){
            q.push(i);
        }
    }
    while(q.empty()==false){
        long long parent = q.front();
        ans.push_back(parent);
        q.pop();
        for(auto nbr: adjList[parent]){
            inorder[nbr]--;
            if(inorder[nbr]==0){
                q.push(nbr);
            }
        }
    }
    if(ans.size()==n){
        for(auto i : ans){
            cout<<i<<' ';
        }
    }
    else{
        cout<<"IMPOSSIBLE"<<'\n';
    }
}

int main() {
    fast_io;
    solve();
    return 0;
}