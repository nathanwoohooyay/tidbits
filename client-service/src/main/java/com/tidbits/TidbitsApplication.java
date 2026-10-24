package com.tidbits;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TidbitsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TidbitsApplication.class, args);
    }
}
