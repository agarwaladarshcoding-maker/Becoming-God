use std::io::{self, Read};

fn get_ans(diff: &mut i64, total_a: i64, total_b: i64, arr: &[i64], index: usize) {
    if index == arr.len() {
        *diff = (*diff).min((total_a - total_b).abs());
        return;
    }
    
    // Include the current element in total_a
    get_ans(diff , total_a + arr[index], total_b, arr, index + 1);
    
    // Include the current element in total_b
    get_ans(diff, total_a, total_b + arr[index], arr, index + 1);
}

fn solve() {
    // Read all standard input at once for fast I/O
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    // Read `n`
    if let Some(n_str) = iter.next() {
        let n: usize = n_str.parse().unwrap();
        
        // Read the array elements
        let mut arr: Vec<i64> = Vec::with_capacity(n);
        for _ in 0..n {
            arr.push(iter.next().unwrap().parse().unwrap());
        }

        let mut diff = std::i64::MAX;
        
        // We pass `arr` as a slice `&arr` and `diff` as a mutable reference `&mut diff`
        get_ans(&mut diff, 0, 0, &arr, 0);
        
        println!("{}", diff);
    }
}

fn main() {
    solve();
}