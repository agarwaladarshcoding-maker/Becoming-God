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
    vector<long long> b(n);
    vector<long long> ans(n);
    long long countZeros = 0;
    vector<long long> positives;
    vector<long long> negatives;
    for(int i =0;i<n;i++){
        cin>>b[i];
        if(b[i]==0) countZeros++;
        else if(b[i]>0) positives.push_back(b[i]);
        else negatives.push_back(b[i]);
    }
    long long value = 0;
    if(positives.size()==0){
        cout<<-1<<'\n';
        return ;
    }
    else{
        sort(positives.begin(), positives.end());
        sort(negatives.begin(), negatives.end(), greater<long long>());

        int l1 = positives.size();
        int l2 = negatives.size();
        int i =0;
        int j =0;
        int mainIndex = 0;

        value+=positives[i++];
        ans[mainIndex++] = value;
        

        //check if any negatives;
        while(j<l2&&value+negatives[j]>=1){
    
            value+= negatives[j];
            ans[mainIndex++] = value;
            j++;
        }
        //s bhnettle down zeros;
        while(countZeros>0){
            ans[mainIndex++]  = value;
            countZeros--;
        }
       
        while(i<l1&&j<l2){
            //get a postive value;
            value+=positives[i];
            i++;
            ans[mainIndex++] = value;
            //try out small it using negaitives
            while(j<l2&&value+negatives[j]>=1){
                value +=negatives[j];
                ans[mainIndex++] = value;
                j++;
            }
            //repeats loop]
        }
        while(i<l1){
            value += positives[i++];
            ans[mainIndex++] = value;
        }
        while(j<l2){
            value +=negatives[j++];
            if(value<=0){
                cout<<-1<<'\n';
                return ;
            }
            ans[mainIndex++] = value;
        }
        for(int i = 0;i<ans.size();i++){
            cout<<ans[i]<<' ';
        }
        cout<<'\n';
    }

}

int main() {
    fast_io;
    int t;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}