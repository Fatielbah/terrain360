package Pfe.T360.repository;

import Pfe.T360.entity.Rappel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RappelRepository extends JpaRepository<Rappel, Long> {

    // Trouver un rappel par événement
    Optional<Rappel> findByEvenementId(Long evenementId);

    // Savoir si un rappel a déjà été envoyé pour un événement
    boolean existsByEvenementIdAndEnvoyeTrue(Long evenementId);
    


}
