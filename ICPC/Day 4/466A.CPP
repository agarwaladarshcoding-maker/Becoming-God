#include<iostream>
using namespace std;
int main(){
    long long n;
    long long m;
    long long a;
    long long b;
    cin>>n>>m>>a>>b;
    // if m/b is less than a
    long long per_ticket_cost = ((double)b)/m;
    if(per_ticket_cost<a){
        double batches = n/m;
        double totalCost = batches*b;
        n= n- batches*m;
        if(n*a<=b){
            totalCost+=n*a;
        }
        else{
            totalCost+=b;
        }
        cout<<totalCost<<'\n';

    }
    else{
        cout<<a*n<<'\n';
    }
    return 0;
}