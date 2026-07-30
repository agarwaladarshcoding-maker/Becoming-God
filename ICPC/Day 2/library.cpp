#include <iostream>
#include <vector>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int N, Q;
    // N: size of array, Q: number of queries
    cin >> N >> Q;

    // We use a difference array of size N + 2 to handle 1-based indexing 
    // and safely process the D[R + 1] boundary condition.
    vector<long long> D(N + 2, 0);

    // Process Q queries in O(Q) time
    for (int i = 0; i < Q; i++) {
        int L, R;
        long long V;
        cin >> L >> R >> V;

        // Apply difference array technique O(1)
        D[L] += V;
        D[R + 1] -= V;
    }

    // Reconstruct the original array in O(N) time
    vector<long long> A(N + 1, 0);
    for (int i = 1; i <= N; i++) {
        // A[i] is the prefix sum of D
        A[i] = A[i - 1] + D[i];
    }

    // Output the final array
    for (int i = 1; i <= N; i++) {
        cout << A[i] << (i == N ? "" : " ");
    }
    cout << "\n";

    return 0;
}