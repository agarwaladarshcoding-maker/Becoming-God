#include<iostream>
using namespace std;
void solve(){
    long long n;
    cin>>n;
    vector<long long> row1(n);
    vector<long long> row2(n);
    for(int i = 0;i<n;i++){
        cin>>row1[i];
    }
    for(int i= 0;i<n;i++){
        cin>>row2[i];
    }
    if(n==1){
        cout<<row1[0]+ row2[0]<<'\n';
    }
    else{
        long long countAbove = 0;
        long long ans = 0;
        long long maxIndexPoint = 0;
        long long maxColSum = row1[0] + row2[0];
        for(int i= 0; i<n;i++){
            if(row1[i]>=row2[i]){
                ans += row1[i];
            }
            else{
                ans+= row2[i];
            }
            long long currentSum = row1[i] + row2[i];
            if(maxColSum<currentSum){
                maxColSum = currentSum;
                maxIndexPoint = i;
            }
        }
        if(row1[maxIndexPoint]>=row2[maxIndexPoint]){
            ans = ans - row1[maxIndexPoint] + maxColSum;
        }
        else{
            ans = ans - row2[maxIndexPoint] + maxColSum;
        }
        cout<<ans<<'\n';
    }


}
int main(){
    int t;
    cin>>t;
    while(t--){
        solve();
    }
}
