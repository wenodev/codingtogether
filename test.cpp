#include<iostream>
#include<ctime>
#include<cstdlib>
using namespace std;

class Random {
	public:
		static void seed() { srand((unsigned)time(0));}
		static int nextInt(int min=0, int max = 32767);
		static char nextAlphabet();
		static double nextDouble();
};
int Random::nextInt(int min, int max){
	return (rand()%max) + min; 
}

char Random::nextAlphabet() {
	int n = rand() % 2;
	if( n == 0) { 
		n = 65 + rand() % 26; 
		return n; 
	} 
	else { 
		n = 97 + rand() % 26; 
		return n; 
	}
}
double Random::nextDouble() {
	double n = rand() / (double)(RAND_MAX+1.0);
	return n;
}


int main() {
	cout << "2012305505 이주형 6-7" << endl;
	Random::seed();
	cout << "1에서 100까지 랜덤한 정수 10개를 출력합니다."<<endl;
	for(int i=0; i<10; i++)
		cout << Random::nextInt(1,100) << ' ';
	cout << endl;

	cout << "알파벳을 랜덤하게 10개를 출력합니다."<<endl;
	for(int i=0; i<10; i++)
		cout << Random::nextAlphabet() << ' ';
	cout << endl;

	cout << "랜덤한 실수 10개를 출력합니다." << endl;
	for(int i=0; i<10; i++){
		cout << Random::nextDouble() << ' ';
		if(i==4)
			cout << endl;
	}
	cout << endl;
}
