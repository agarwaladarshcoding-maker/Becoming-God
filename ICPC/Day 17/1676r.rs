use std::io::{self, Read, Write};

// Finds the parent of a node with path compression
fn find_parent(parents: &mut [usize], u: usize) -> usize {
    if u == parents[u] {
        u
    } else {
        // Extract the parent index to avoid mutable borrow conflicts
        let p = parents[u];
        let root = find_parent(parents, p);
        parents[u] = root; // Path compression
        root
    }
}

fn solve() {
    // Fast I/O: Read all input into a string at once
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).expect("Failed to read input");
    let mut tokens = input.split_whitespace();

    // Helper closure to parse the next token safely
    let mut next_token = || -> Option<usize> {
        tokens.next().map(|s| s.parse().expect("Parse error"))
    };

    let n = match next_token() {
        Some(val) => val,
        None => return, // EOF
    };
    let q = next_token().unwrap();

    let mut roads = Vec::with_capacity(q);
    for _ in 0..q {
        let u = next_token().unwrap();
        let v = next_token().unwrap();
        roads.push((u, v));
    }

    // maxi = (number of components, max size)
    let mut maxi = (n, 1);
    
    // Initialize parents array where parents[i] = i
    let mut parents: Vec<usize> = (0..=n).collect();
    // Initialize size array with 1s
    let mut size: Vec<usize> = vec![1; n + 1];

    // Fast Output: Use a buffered writer locked to stdout
    let stdout = io::stdout();
    let mut out = io::BufWriter::new(stdout.lock());

    for (u, v) in roads {
        let parentu = find_parent(&mut parents, u);
        let parentv = find_parent(&mut parents, v);

        if parentu == parentv {
            continue; // already same component — do nothing
        }

        // Attach smaller component to larger component (Union by Size)
        if size[parentu] < size[parentv] {
            maxi.0 -= 1;
            parents[parentu] = parentv; // attach ROOT to ROOT
            size[parentv] += size[parentu];
            maxi.1 = maxi.1.max(size[parentv]);
        } else {
            maxi.0 -= 1;
            parents[parentv] = parentu;
            size[parentu] += size[parentv];
            maxi.1 = maxi.1.max(size[parentu]);
        }
        
        writeln!(out, "{} {}", maxi.0, maxi.1).unwrap();
    }
}

fn main() {
    solve();
}