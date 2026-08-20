#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void printArray(const vector<int>& arr)
{
    for (int value : arr)
    {
        cout << value << " ";
    }
    cout << '\n';
}

void maxHeapify(vector<int>& arr, int n, int index)
{
    while (true)
    {
        int largest = index;
        int left = 2 * index + 1;
        int right = 2 * index + 2;

        if (left < n && arr[left] > arr[largest])
        {
            largest = left;
        }

        if (right < n && arr[right] > arr[largest])
        {
            largest = right;
        }

        if (largest == index)
        {
            break;
        }

        swap(arr[index], arr[largest]);
        index = largest;
    }
}

void heapSort(vector<int>& arr)
{
    int n = static_cast<int>(arr.size());

    for (int i = n / 2 - 1; i >= 0; i--)
    {
        maxHeapify(arr, n, i);
    }

    for (int i = n - 1; i > 0; i--)
    {
        swap(arr[0], arr[i]);
        maxHeapify(arr, i, 0);
    }
}

int main()
{
    int n;
    cout << "Enter number of elements: ";
    cin >> n;

    if (n < 0)
    {
        cout << "Invalid input\n";
        return 0;
    }

    vector<int> arr(n);
    cout << "Enter elements: ";
    for (int i = 0; i < n; i++)
    {
        cin >> arr[i];
    }

    cout << "Original array: ";
    printArray(arr);

    heapSort(arr);

    cout << "Sorted array: ";
    printArray(arr);

    return 0;
}
