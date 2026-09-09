#include <iostream>

using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

void solve() {
    long long x, y;
    cin >> x >> y;
    long long sum = x + y;
    long long x_new = 0;
    
    for (long long i = 30; i >= 0; i--) {
        if ((sum >> i) & 1) {
            if (x_new + (1LL << i) <= x) {
                x_new += (1LL << i);
            }
        }
    
    }
    cout << sum << " " << x - x_new << "\n";
}

int main() {
    fast_io;
    int qrTNum;
    cin >> qrTNum;
    while (qrTNum--) {
        solve();
    }
    return 0;
}