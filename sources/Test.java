class MyThread extends Thread {
	MyThread(String name) {
		super(name);
	}
	public void run() {
		while(true) {
			System.out.println(getName()+" is now running");
			try {
				sleep(5*1000);
			} catch(InterruptedException e) {
				System.out.println("Interrupted is received");
				break;
			}
		}
	}
}
public class Test {

	public static void main(String[] args) {
		System.out.println("aa");
	}
}
