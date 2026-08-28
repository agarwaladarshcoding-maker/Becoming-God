class DSU {
    private int[] parent;
    private int[] rank;
    private int components;
    public DSU(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
        }
    }
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }
    public boolean union(int x, int y) {
        int px = find(x);
        int py = find(y);
        if (px == py) {
            return false;  // Already in same set
        }
        // Union by rank
        if (rank[px] < rank[py]) {
            int temp = px;
            px = py;
            py = temp;
        }
        parent[py] = px;
        if (rank[px] == rank[py]) {
            rank[px]++;
        }
        components--;
        return true;
    }
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }
    public int countComponents() {
        return components;
    }
}