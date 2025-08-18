package Pfe.T360.config;

import Pfe.T360.entity.Services;
import Pfe.T360.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import java.util.List;

@Component
public class ServiceInitializer {

    @Autowired
    private ServiceRepository servicesRepository;

    @PostConstruct
    public void initServices() {
        List<String> serviceNames = Arrays.asList(
                "Direction Générale", // Pour ADMIN
                "RH",                 // Pour RH
                "Informatique",       // Pour INFORMATICIEN
                "Opérations",         // Pour SUPERVISEUR
                "Études"              // Pour ENQUETEUR
        );

        for (String name : serviceNames) {
            servicesRepository.findByNom(name)
                .orElseGet(() -> {
                    Services s = new Services();
                    s.setNom(name);
                    return servicesRepository.save(s);
                });
        }

        System.out.println("✅ Services initiaux insérés avec succès !");
    }
}
