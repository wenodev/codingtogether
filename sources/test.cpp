#include<iostream>
using namespace std;
class Sum {
public:
	Sum(int x, int y) { cout << x+y << endl; }
};
int main() 
{
	Sum(3,7);
}