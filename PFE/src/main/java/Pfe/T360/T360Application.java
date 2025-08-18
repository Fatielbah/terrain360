package Pfe.T360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"Pfe.T360.service", "Pfe.T360.controller", "Pfe.T360.config","Pfe.T360.security","Pfe.T360.repository"})
@EntityScan(basePackages = "Pfe.T360.entity")
@EnableJpaRepositories("Pfe.T360.repository")
@EnableScheduling
@EnableAsync
public class T360Application {

	public static void main(String[] args) {
		SpringApplication.run(T360Application.class, args);
	}

}
