package com.hmcs.savings;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.hmcs.savings.entity.SavingsAccountType;
import com.hmcs.savings.repository.SavingsAccountTypeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableScheduling
public class HmcsSavingsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(HmcsSavingsServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(SavingsAccountTypeRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                String[][] initialTypes = {
                        {"NORMAL", "Normal Savings", "සාමාන්ය"},
                        {"JANASETHA", "Janasetha", "ජනසෙත"},
                        {"DHANA_YOJANA", "Dhana Yojana", "ධන යෝජනා"},
                        {"VANDANA", "Vandana", "වන්දනා"},
                        {"ARUNALU", "Arunalu", "අරුණලු"},
                        {"RANTHILINA", "Ranthilina", "රන්තිලින"}
                };

                for (String[] t : initialTypes) {
                    SavingsAccountType type = new SavingsAccountType();
                    type.setCode(t[0]);
                    type.setNameEn(t[1]);
                    type.setNameSi(t[2]);
                    
                    if (t[0].equals("ARUNALU") || t[0].equals("RANTHILINA")) {
                        type.setIsChildAccount(true);
                    } else {
                        type.setIsChildAccount(false);
                    }
                    
                    repository.save(type);
                }
            }
        };
    }
}

