#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void printHeap(const vector<int>& heap)
{
    for (int value : heap)
    {
        cout << value << " ";
    }
    cout << '\n';
}

bool compareValues(int a, int b, int type)
{
    if (type == 1)
    {
        return a < b;
    }
    return a > b;
}

void heapifyDown(vector<int>& heap, int n, int index, int type)
{
    while (true)
    {
        int best = index;
        int left = 2 * index + 1;
        int right = 2 * index + 2;

        if (left < n && compareValues(heap[left], heap[best], type))
        {
            best = left;
        }

        if (right < n && compareValues(heap[right], heap[best], type))
        {
            best = right;
        }

        if (best == index)
        {
            break;
        }

        swap(heap[index], heap[best]);
        index = best;
    }
}

void buildHeap(vector<int>& heap, int type)
{
    for (int i = static_cast<int>(heap.size()) / 2 - 1; i >= 0; i--)
    {
        heapifyDown(heap, static_cast<int>(heap.size()), i, type);
    }
}

int extractRoot(vector<int>& heap, int type)
{
    int root = heap[0];
    heap[0] = heap.back();
    heap.pop_back();

    if (!heap.empty())
    {
        heapifyDown(heap, static_cast<int>(heap.size()), 0, type);
    }

    return root;
}

int main()
{
    int type;
    cout << "1. Min Heap\n";
    cout << "2. Max Heap\n";
    cout << "Enter choice: ";
    cin >> type;

    int n;
    cout << "Enter number of elements: ";
    cin >> n;

    vector<int> heap(n);
    cout << "Enter elements: ";
    for (int i = 0; i < n; i++)
    {
        cin >> heap[i];
    }

    if (n == 0 || (type != 1 && type != 2))
    {
        cout << "Invalid input\n";
        return 0;
    }

    buildHeap(heap, type);

    cout << "Heap: ";
    printHeap(heap);

    int extracted = extractRoot(heap, type);

    if (type == 1)
    {
        cout << "Extracted minimum: ";
    }
    else
    {
        cout << "Extracted maximum: ";
    }
    cout << extracted << '\n';

    cout << "Heap after extraction: ";
    printHeap(heap);

    return 0;
}
