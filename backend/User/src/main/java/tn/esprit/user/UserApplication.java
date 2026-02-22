package tn.esprit.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UserApplication {
	public static void main(String[] args) {
		SpringApplication.run(UserApplication.class, args);
		System.setProperty("java.net.preferIPv4Stack", "true");
		SpringApplication.run(UserApplication.class, args);
	}
}