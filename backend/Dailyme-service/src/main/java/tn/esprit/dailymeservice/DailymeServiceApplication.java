package tn.esprit.dailymeservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class DailymeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DailymeServiceApplication.class, args);
    }

}
