#include <iostream>
#include <string>
#include <vector>

using namespace std;

// The exact O(n) prefix function from before
vector<int> prefix_function(string s) {
    int n = (int)s.length();
    vector<int> pi(n);
    for (int i = 1; i < n; i++) {
        int j = pi[i-1];
        while (j > 0 && s[i] != s[j])
            j = pi[j-1];
        if (s[i] == s[j])
            j++;
        pi[i] = j;
    }
    return pi;
}

int main() {
    // Fast I/O for competitive programming
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string text, pattern;
    if (!(cin >> text >> pattern)) return 0;

    // 1. Create a combined string using a separator not present in the input
    // The separator prevents prefix matches from bleeding past the pattern
    string combined = pattern + "#" + text;

    // 2. Compute the pi array for the combined string
    vector<int> pi = prefix_function(combined);

    int p_len = pattern.length();
    int match_count = 0;

    // 3. Count occurrences
    // We only need to check the pi values in the 'text' part of our combined string
    for (int i = p_len + 1; i < combined.length(); i++) {
        if (pi[i] == p_len) {
            match_count++;
        }
    }

    cout << match_count << "\n";

    return 0;
}