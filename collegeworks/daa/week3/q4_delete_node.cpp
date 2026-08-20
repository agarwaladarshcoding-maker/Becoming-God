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

void heapifyUp(vector<int>& heap, int index, int type)
{
    while (index > 0)
    {
        int parent = (index - 1) / 2;

        if (!compareValues(heap[index], heap[parent], type))
        {
            break;
        }

        swap(heap[index], heap[parent]);
        index = parent;
    }
}

void buildHeap(vector<int>& heap, int type)
{
    for (int i = static_cast<int>(heap.size()) / 2 - 1; i >= 0; i--)
    {
        heapifyDown(heap, static_cast<int>(heap.size()), i, type);
    }
}

int deleteNode(vector<int>& heap, int index, int type)
{
    int deletedValue = heap[index];
    heap[index] = heap.back();
    heap.pop_back();

    if (index < static_cast<int>(heap.size()))
    {
        int parent = (index - 1) / 2;

        if (index > 0 && compareValues(heap[index], heap[parent], type))
        {
            heapifyUp(heap, index, type);
        }
        else
        {
            heapifyDown(heap, static_cast<int>(heap.size()), index, type);
        }
    }

    return deletedValue;
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

    if (n <= 0 || (type != 1 && type != 2))
    {
        cout << "Invalid input\n";
        return 0;
    }

    buildHeap(heap, type);

    cout << "Heap: ";
    printHeap(heap);

    int index;
    cout << "Enter index to delete: ";
    cin >> index;

    if (index < 0 || index >= n)
    {
        cout << "Invalid index\n";
        return 0;
    }

    int deletedValue = deleteNode(heap, index, type);

    cout << "Deleted value: " << deletedValue << '\n';
    cout << "Heap after deletion: ";
    printHeap(heap);

    return 0;
}
