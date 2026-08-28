#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>
#include <cfloat>

struct Point {
    double x, y;
};

double getDistance(const Point& p1, const Point& p2) {
    return std::sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

// bruth force algo 
double bruteForce(const std::vector<Point>& points, int left, int right) {
    double min_dist = DBL_MAX;
    for (int i = left; i <= right; ++i) {
        for (int j = i + 1; j <= right; ++j) {
            double dist = getDistance(points[i], points[j]);
            if (dist < min_dist) {
                min_dist = dist;
            }
        }
    }
    return min_dist;
}


double stripClosest(std::vector<Point>& strip, double d) {
    double min_dist = d; 

    std::sort(strip.begin(), strip.end(), [](const Point& a, const Point& b) {
        return a.y < b.y;
    });

    for (int i = 0; i < strip.size(); ++i) {
        for (int j = i + 1; j < strip.size() && (strip[j].y - strip[i].y) < min_dist; ++j) {
            double dist = getDistance(strip[i], strip[j]);
            if (dist < min_dist) {
                min_dist = dist;
            }
        }
    }
    return min_dist;
}

double closestPairUtil(const std::vector<Point>& points, int left, int right) {
    if (right - left <= 2) {
        return bruteForce(points, left, right);
    }

    int mid = left + (right - left) / 2;
    Point midPoint = points[mid];

    double dl = closestPairUtil(points, left, mid);
    double dr = closestPairUtil(points, mid + 1, right);

    double d = std::min(dl, dr);

    std::vector<Point> strip;
    for (int i = left; i <= right; ++i) {
        if (std::abs(points[i].x - midPoint.x) < d) {
            strip.push_back(points[i]);
        }
    }

    return std::min(d, stripClosest(strip, d));
}


double findClosestPair(std::vector<Point>& points) {
    std::sort(points.begin(), points.end(), [](const Point& a, const Point& b) {
        return a.x < b.x;
    });

    return closestPairUtil(points, 0, points.size() - 1);
}

int main() {
    std::vector<Point> points = {
        {2.0, 3.0}, {12.0, 30.0}, {40.0, 50.0}, 
        {5.0, 1.0}, {12.0, 10.0}, {3.0, 4.0}
    };

    std::cout << "The smallest distance is " << findClosestPair(points) << std::endl;

    
    return 0;
}